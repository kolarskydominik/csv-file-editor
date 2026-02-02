const API_BASE = "/api";

export type Metadata = {
	totalRows: number;
	columns: string[];
	totalLinksRows: number;
	isDirty: boolean;
	dirtyCount: number;
	fileName: string;
	linkColumns: string[];
};

export type RowData = {
	index: number;
	data: Record<string, string>;
};

export type UploadResult = {
	success: boolean;
	totalRows: number;
	columns: string[];
	fileName: string;
};

export async function uploadCSV(
	content: string,
	fileName: string,
): Promise<UploadResult> {
	const res = await fetch(`${API_BASE}/upload`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ content, fileName }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.error || "Failed to upload CSV");
	}
	return res.json();
}

export async function setLinkColumns(
	columns: string[],
): Promise<{
	success: boolean;
	totalLinksRows: number;
	linkColumns: string[];
}> {
	const res = await fetch(`${API_BASE}/set-link-columns`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ columns }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.error || "Failed to set columns");
	}
	return res.json();
}

export async function getMetadata(): Promise<Metadata> {
	const res = await fetch(`${API_BASE}/metadata`);
	return res.json();
}

export async function getRows(
	start: number,
	count: number,
): Promise<RowData[]> {
	const res = await fetch(`${API_BASE}/rows?start=${start}&count=${count}`);
	return res.json();
}

export async function getRow(index: number): Promise<RowData> {
	const res = await fetch(`${API_BASE}/row/${index}`);
	if (!res.ok) {
		throw new Error("Row not found");
	}
	return res.json();
}

export async function updateRow(
	index: number,
	column: string,
	value: string,
): Promise<{ success: boolean; isDirty: boolean; dirtyCount: number }> {
	const res = await fetch(`${API_BASE}/row/${index}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ column, value }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.error || "Failed to update");
	}
	return res.json();
}

export function getDownloadUrl(): string {
	return `${API_BASE}/download`;
}

export async function getNextLinkRow(fromRow: number): Promise<number | null> {
	const res = await fetch(`${API_BASE}/links/next?from=${fromRow}`);
	const data = await res.json();
	return data.rowIndex;
}

export async function getPrevLinkRow(fromRow: number): Promise<number | null> {
	const res = await fetch(`${API_BASE}/links/prev?from=${fromRow}`);
	const data = await res.json();
	return data.rowIndex;
}

export async function getAllLinkRows(): Promise<number[]> {
	const res = await fetch(`${API_BASE}/links/all`);
	const data = await res.json();
	return data.rowIndices;
}

export type CellChange = {
	rowIndex: number;
	column: string;
	oldValue: string;
	newValue: string;
	timestamp: number;
};

export async function getChanges(): Promise<CellChange[]> {
	const res = await fetch(`${API_BASE}/changes`);
	const data = await res.json();
	return data.changes;
}
