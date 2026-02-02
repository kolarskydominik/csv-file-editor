import cors from "cors";
import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { csvManager } from "./csv-manager";
import { buildLinkIndex, findNextLinkRow, findPrevLinkRow } from "./link-index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Allow large CSV uploads

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
		res.status(500).json({ error: `Failed to parse CSV: ${error}` });
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
