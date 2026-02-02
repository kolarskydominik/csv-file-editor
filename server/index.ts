import cors from "cors";
import express from "express";
import session from "express-session";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { csvManager } from "./csv-manager";
import {
	clearTokens,
	exchangeCodeForTokens,
	getAuthUrl,
	getValidAccessToken,
	storeTokens,
} from "./google-oauth";
import {
	convertToCSV,
	getSheetData,
	getSheetName,
	updateSheetCells,
} from "./google-sheets";
import { buildLinkIndex, findNextLinkRow, findPrevLinkRow } from "./link-index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(
	cors({
		origin: true,
		credentials: true,
	}),
);
app.use(express.json({ limit: "50mb" })); // Allow large CSV uploads

// Session management for OAuth
app.use(
	session({
		secret:
			process.env.SESSION_SECRET || "your-secret-key-change-in-production",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	}),
);

let linkIndex: number[] = [];
let linkColumns: string[] = [];

// Serve static files from dist directory (production)
if (process.env.NODE_ENV === "production") {
	app.use(express.static(join(__dirname, "../dist")));
}

// POST /api/upload - Upload CSV content
app.post("/api/upload", (req, res) => {
	const { content, fileName } = req.body as {
		content: string;
		fileName: string;
	};

	if (!content) {
		res.status(400).json({ error: "content is required" });
		return;
	}

	try {
		csvManager.loadFromContent(content, fileName || "uploaded.csv");
		// Don't set link columns yet - wait for user to select
		linkColumns = [];
		linkIndex = [];

		res.json({
			success: true,
			totalRows: csvManager.totalRows,
			columns: csvManager.columnNames,
			fileName: csvManager.loadedFileName,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: `Failed to parse CSV: ${errorMessage}` });
	}
});

// POST /api/set-link-columns - Set which columns contain links
app.post("/api/set-link-columns", (req, res) => {
	const { columns } = req.body as { columns: string[] };

	if (!columns || columns.length === 0) {
		res.status(400).json({ error: "columns array is required" });
		return;
	}

	linkColumns = columns;
	linkIndex = buildLinkIndex(csvManager.getAllData(), linkColumns);

	res.json({
		success: true,
		totalLinksRows: linkIndex.length,
		linkColumns,
	});
});

// GET /api/metadata
app.get("/api/metadata", (_req, res) => {
	res.json({
		totalRows: csvManager.totalRows,
		columns: csvManager.columnNames,
		totalLinksRows: linkIndex.length,
		isDirty: csvManager.isDirty,
		dirtyCount: csvManager.dirtyCount,
		fileName: csvManager.loadedFileName,
		linkColumns,
		googleSpreadsheetId: csvManager.googleSpreadsheetIdValue,
		googleSheetGid: csvManager.googleSheetGidValue,
		googleSheetName: csvManager.googleSheetNameValue,
	});
});

// GET /api/rows?start=0&count=50
app.get("/api/rows", (req, res) => {
	const start = parseInt(req.query.start as string) || 0;
	const count = parseInt(req.query.count as string) || 50;
	res.json(csvManager.getRows(start, count));
});

// GET /api/row/:index
app.get("/api/row/:index", (req, res) => {
	const index = parseInt(req.params.index);
	const row = csvManager.getRow(index);
	if (row) {
		res.json({ index, data: row });
	} else {
		res.status(404).json({ error: "Row not found" });
	}
});

// PATCH /api/row/:index
app.patch("/api/row/:index", (req, res) => {
	const index = parseInt(req.params.index);
	const { column, value } = req.body as { column: string; value: string };

	if (!column || value === undefined) {
		res.status(400).json({ error: "column and value are required" });
		return;
	}

	const success = csvManager.updateCell(index, column, value);
	if (success) {
		// Rebuild link index if we modified a link column
		if (linkColumns.includes(column)) {
			linkIndex = buildLinkIndex(csvManager.getAllData(), linkColumns);
		}
		res.json({
			success: true,
			isDirty: csvManager.isDirty,
			dirtyCount: csvManager.dirtyCount,
		});
	} else {
		res.status(404).json({ error: "Row or column not found" });
	}
});

// GET /api/download - Download modified CSV
app.get("/api/download", (_req, res) => {
	const csv = csvManager.exportCSV();
	const fileName = csvManager.loadedFileName.replace(".csv", "-modified.csv");

	res.setHeader("Content-Type", "text/csv");
	res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
	res.send(csv);
});

// GET /api/links/next?from=0
app.get("/api/links/next", (req, res) => {
	const from = parseInt(req.query.from as string) || 0;
	const rowIndex = findNextLinkRow(linkIndex, from);
	res.json({ rowIndex });
});

// GET /api/links/prev?from=100
app.get("/api/links/prev", (req, res) => {
	const from = parseInt(req.query.from as string) || 0;
	const rowIndex = findPrevLinkRow(linkIndex, from);
	res.json({ rowIndex });
});

// GET /api/links/all - Get all row indices with links
app.get("/api/links/all", (_req, res) => {
	res.json({ rowIndices: linkIndex });
});

// GET /api/changes - Get all cell changes made in this session
app.get("/api/changes", (_req, res) => {
	const changes = csvManager.getChanges();
	res.json({ changes });
});

// Google OAuth endpoints

// GET /api/google/auth - Initiate OAuth flow
app.get("/api/google/auth", (req, res) => {
	try {
		const sessionId = req.sessionID;
		const authUrl = getAuthUrl(sessionId);
		res.json({ authUrl });
	} catch (error: any) {
		res
			.status(500)
			.json({ error: error.message || "Failed to initiate OAuth flow" });
	}
});

// GET /api/google/callback - Handle OAuth callback
app.get("/api/google/callback", async (req, res) => {
	try {
		const { code, state } = req.query;

		if (!code || typeof code !== "string") {
			return res.status(400).json({ error: "Authorization code missing" });
		}

		const sessionId = state as string;
		if (sessionId !== req.sessionID) {
			return res.status(400).json({ error: "Invalid session state" });
		}

		const tokens = await exchangeCodeForTokens(code);
		storeTokens(sessionId, tokens);

		// Redirect to frontend with success
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		res.redirect(`${frontendUrl}?google_auth=success`);
	} catch (error) {
		console.error("OAuth callback error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Authentication failed";
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		res.redirect(
			`${frontendUrl}?google_auth=error&message=${encodeURIComponent(errorMessage)}`,
		);
	}
});

// GET /api/google/token - Check authentication status
app.get("/api/google/token", async (req, res) => {
	try {
		const sessionId = req.sessionID;
		const accessToken = await getValidAccessToken(sessionId);
		res.json({ authenticated: accessToken !== null });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to check authentication";
		res.status(500).json({ error: errorMessage });
	}
});

// POST /api/google/logout - Clear OAuth session
app.post("/api/google/logout", (req, res) => {
	try {
		const sessionId = req.sessionID;
		clearTokens(sessionId);
		req.session.destroy(() => {
			res.json({ success: true });
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to logout";
		res.status(500).json({ error: errorMessage });
	}
});

// Google Sheets API endpoints

// POST /api/google/load-sheet - Load sheet from Google Sheets
app.post("/api/google/load-sheet", async (req, res) => {
	try {
		const { spreadsheetId, gid } = req.body as {
			spreadsheetId: string;
			gid?: string | null;
		};

		if (!spreadsheetId) {
			return res.status(400).json({ error: "spreadsheetId is required" });
		}

		const sessionId = req.sessionID;
		const accessToken = await getValidAccessToken(sessionId);

		if (!accessToken) {
			return res.status(401).json({
				error: "Not authenticated. Please authenticate with Google first.",
			});
		}

		// Get sheet name
		const sheetName = await getSheetName(
			spreadsheetId,
			gid || null,
			accessToken,
		);

		// Load sheet data (use sheet name as range, or default to first sheet)
		const range = sheetName;
		const { headers, values } = await getSheetData(
			spreadsheetId,
			range,
			accessToken,
		);

		// Convert to CSV
		const csvContent = convertToCSV(headers, values);

		// Load into CSV manager with Google Sheets metadata
		csvManager.loadFromContent(csvContent, `${sheetName}.csv`, {
			spreadsheetId,
			gid: gid || null,
			sheetName,
		});

		// Reset link columns
		linkColumns = [];
		linkIndex = [];

		res.json({
			success: true,
			totalRows: csvManager.totalRows,
			columns: csvManager.columnNames,
			fileName: csvManager.loadedFileName,
			googleSpreadsheetId: spreadsheetId,
			googleSheetGid: gid || null,
			googleSheetName: sheetName,
		});
	} catch (error) {
		console.error("Load sheet error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to load sheet";
		res.status(500).json({ error: errorMessage });
	}
});

// POST /api/google/save-sheet - Save changes back to Google Sheets
app.post("/api/google/save-sheet", async (req, res) => {
	try {
		const spreadsheetId = csvManager.googleSpreadsheetIdValue;
		const sheetName = csvManager.googleSheetNameValue;

		if (!spreadsheetId || !sheetName) {
			return res
				.status(400)
				.json({ error: "No Google Sheet loaded. Please load a sheet first." });
		}

		const sessionId = req.sessionID;
		const accessToken = await getValidAccessToken(sessionId);

		if (!accessToken) {
			return res.status(401).json({
				error: "Not authenticated. Please authenticate with Google first.",
			});
		}

		// Get changes
		const changes = csvManager.getChanges();
		if (changes.length === 0) {
			return res.json({
				success: true,
				cellsUpdated: 0,
				message: "No changes to save",
			});
		}

		// Convert changes to A1 notation
		const headers = csvManager.columnNames;
		const updates = changes.map((change) => {
			// Convert row index and column name to A1 notation
			const columnIndex = headers.indexOf(change.column);
			if (columnIndex === -1) {
				throw new Error(`Column "${change.column}" not found`);
			}

			// Convert column index to letter
			let columnLetter = "";
			let col = columnIndex;
			while (col >= 0) {
				columnLetter = String.fromCharCode(65 + (col % 26)) + columnLetter;
				col = Math.floor(col / 26) - 1;
			}

			// A1 notation uses 1-based row numbers
			const rowNumber = change.rowIndex + 1;
			const range = `${columnLetter}${rowNumber}`;

			return {
				range,
				value: change.newValue,
			};
		});

		// Update sheet
		const cellsUpdated = await updateSheetCells(
			spreadsheetId,
			sheetName,
			updates,
			accessToken,
		);

		// Clear dirty state after successful save
		// Note: We don't clear changes history, but mark as not dirty
		// The CSV manager will still track changes, but we've synced to Google Sheets

		res.json({
			success: true,
			cellsUpdated,
		});
	} catch (error) {
		console.error("Save sheet error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to save sheet";
		res.status(500).json({ error: errorMessage });
	}
});

// Serve React app for all non-API routes (production)
// Express 5 doesn't support app.get('*'), so we use app.use() with a catch-all
if (process.env.NODE_ENV === "production") {
	// Catch-all handler - must be last, after all API routes
	app.use((req, res) => {
		// If it's an API route that wasn't matched, return 404
		if (req.path.startsWith("/api")) {
			return res.status(404).json({ error: "API route not found" });
		}
		// Serve index.html for SPA routing (React Router handles client-side routes)
		res.sendFile(join(__dirname, "../dist/index.html"));
	});
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`CSV Editor API running on http://localhost:${PORT}`);
	console.log("Drag and drop a CSV file to start editing");
});
