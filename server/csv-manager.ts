import Papa from "papaparse";

export type CSVRow = {
	[key: string]: string;
};

export type CellChange = {
	rowIndex: number;
	column: string;
	oldValue: string;
	newValue: string;
	timestamp: number;
};

export class CSVManager {
	private data: CSVRow[] = [];
	private columns: string[] = [];
	private fileName: string = "";
	private dirtyRows: Set<number> = new Set();
	private changes: CellChange[] = [];
	private googleSpreadsheetId: string | null = null;
	private googleSheetGid: string | null = null;
	private googleSheetName: string | null = null;

	// Load from CSV content string (for drag-and-drop upload)
	loadFromContent(
		content: string,
		fileName: string,
		googleMetadata?: {
			spreadsheetId: string;
			gid: string | null;
			sheetName: string | null;
		},
	): void {
		this.fileName = fileName;

		const result = Papa.parse<CSVRow>(content, {
			header: true,
			skipEmptyLines: true,
		});

		this.data = result.data;
		this.columns = result.meta.fields || [];
		this.dirtyRows.clear();
		this.changes = [];

		// Store Google Sheets metadata if provided
		if (googleMetadata) {
			this.googleSpreadsheetId = googleMetadata.spreadsheetId;
			this.googleSheetGid = googleMetadata.gid;
			this.googleSheetName = googleMetadata.sheetName;
		} else {
			// Clear Google Sheets metadata for regular CSV uploads
			this.googleSpreadsheetId = null;
			this.googleSheetGid = null;
			this.googleSheetName = null;
		}
	}

	getRow(index: number): CSVRow | null {
		return this.data[index] || null;
	}

	getRows(
		start: number,
		count: number,
	): Array<{ index: number; data: CSVRow }> {
		return this.data.slice(start, start + count).map((row, i) => ({
			index: start + i,
			data: row,
		}));
	}

	getAllData(): CSVRow[] {
		return this.data;
	}

	updateCell(rowIndex: number, column: string, value: string): boolean {
		if (this.data[rowIndex] && column in this.data[rowIndex]) {
			const oldValue = this.data[rowIndex][column];

			// Only track if value actually changed
			if (oldValue !== value) {
				this.data[rowIndex][column] = value;
				this.dirtyRows.add(rowIndex);

				// Track the change
				const change: CellChange = {
					rowIndex,
					column,
					oldValue,
					newValue: value,
					timestamp: Date.now(),
				};

				// Check if we already have a change for this cell and update it instead of adding duplicate
				const existingChangeIndex = this.changes.findIndex(
					(c) => c.rowIndex === rowIndex && c.column === column,
				);

				if (existingChangeIndex >= 0) {
					// Update existing change, but keep original oldValue
					this.changes[existingChangeIndex] = {
						...change,
						oldValue: this.changes[existingChangeIndex].oldValue,
					};
				} else {
					// Add new change
					this.changes.push(change);
				}

				return true;
			}
			return true; // Value didn't change, but cell exists
		}
		return false;
	}

	// Export as CSV string (for download)
	exportCSV(): string {
		return Papa.unparse(this.data, { columns: this.columns });
	}

	get totalRows(): number {
		return this.data.length;
	}

	get isDirty(): boolean {
		return this.dirtyRows.size > 0;
	}

	get dirtyCount(): number {
		return this.dirtyRows.size;
	}

	get columnNames(): string[] {
		return this.columns;
	}

	get loadedFileName(): string {
		return this.fileName;
	}

	getChanges(): CellChange[] {
		return [...this.changes];
	}

	getChangesForRow(rowIndex: number): CellChange[] {
		return this.changes.filter((c) => c.rowIndex === rowIndex);
	}

	get googleSpreadsheetIdValue(): string | null {
		return this.googleSpreadsheetId;
	}

	get googleSheetGidValue(): string | null {
		return this.googleSheetGid;
	}

	get googleSheetNameValue(): string | null {
		return this.googleSheetName;
	}
}

export const csvManager = new CSVManager();
