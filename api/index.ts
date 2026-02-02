import cors from "cors";
import express, { type Request, type Response } from "express";
import { csvManager } from "../server/csv-manager.js";
import {
	buildLinkIndex,
	findNextLinkRow,
	findPrevLinkRow,
} from "../server/link-index.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

let linkIndex: number[] = [];
let linkColumns: string[] = [];

// POST /api/upload
app.post("/api/upload", (req: Request, res: Response) => {
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
		linkColumns = [];
		linkIndex = [];

		res.json({
			success: true,
			totalRows: csvManager.totalRows,
			columns: csvManager.columnNames,
			fileName: csvManager.loadedFileName,
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to parse CSV",
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

// POST /api/set-link-columns
app.post("/api/set-link-columns", (req: Request, res: Response) => {
	const { columns } = req.body as { columns: string[] };

	if (!columns || columns.length === 0) {
		res.status(400).json({ error: "columns array is required" });
		return;
	}

	linkColumns = columns;
	linkIndex = buildLinkIndex(csvManager.getAllData(), columns);

	res.json({
		success: true,
		totalLinksRows: linkIndex.length,
		linkColumns,
	});
});

// GET /api/metadata
app.get("/api/metadata", (_req: Request, res: Response) => {
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

// GET /api/rows
app.get("/api/rows", (req: Request, res: Response) => {
	const start = parseInt((req.query.start as string) || "0");
	const count = parseInt((req.query.count as string) || "50");
	res.json(csvManager.getRows(start, count));
});

// GET /api/row/:index
app.get("/api/row/:index", (req: Request, res: Response) => {
	const index = parseInt(req.params.index);
	const row = csvManager.getRow(index);
	if (row) {
		res.json({ index, data: row });
	} else {
		res.status(404).json({ error: "Row not found" });
	}
});

// PATCH /api/row/:index
app.patch("/api/row/:index", (req: Request, res: Response) => {
	const index = parseInt(req.params.index);
	const { column, value } = req.body as { column: string; value: string };

	if (!column || value === undefined) {
		res.status(400).json({ error: "column and value are required" });
		return;
	}

	const success = csvManager.updateCell(index, column, value);
	if (success) {
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

// GET /api/download
app.get("/api/download", (_req: Request, res: Response) => {
	const csv = csvManager.exportCSV();
	const fileName = csvManager.loadedFileName.replace(".csv", "-modified.csv");

	res.setHeader("Content-Type", "text/csv");
	res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
	res.send(csv);
});

// GET /api/links/next
app.get("/api/links/next", (req: Request, res: Response) => {
	const from = parseInt((req.query.from as string) || "0");
	const rowIndex = findNextLinkRow(linkIndex, from);
	res.json({ rowIndex });
});

// GET /api/links/prev
app.get("/api/links/prev", (req: Request, res: Response) => {
	const from = parseInt((req.query.from as string) || "0");
	const rowIndex = findPrevLinkRow(linkIndex, from);
	res.json({ rowIndex });
});

// GET /api/links/all
app.get("/api/links/all", (_req: Request, res: Response) => {
	res.json({ rowIndices: linkIndex });
});

export default app;
