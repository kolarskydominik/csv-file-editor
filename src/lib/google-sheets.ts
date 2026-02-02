/**
 * Google Sheets URL parsing and utility functions
 */

export type ParsedGoogleSheetsUrl = {
	spreadsheetId: string;
	gid: string | null;
};

/**
 * Parse a Google Sheets URL to extract spreadsheet ID and GID (tab ID)
 * Supports various URL formats:
 * - https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={GID}
 * - https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
 * - https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}
 */
export function parseGoogleSheetsUrl(
	url: string,
): ParsedGoogleSheetsUrl | null {
	try {
		const urlObj = new URL(url);

		// Check if it's a Google Sheets URL
		if (
			!urlObj.hostname.includes("google.com") ||
			!urlObj.pathname.includes("/spreadsheets/d/")
		) {
			return null;
		}

		// Extract spreadsheet ID from pathname
		const pathMatch = urlObj.pathname.match(
			/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
		);
		if (!pathMatch) {
			return null;
		}

		const spreadsheetId = pathMatch[1];

		// Extract GID from hash fragment
		let gid: string | null = null;
		if (urlObj.hash) {
			const gidMatch = urlObj.hash.match(/gid=(\d+)/);
			if (gidMatch) {
				gid = gidMatch[1];
			}
		}

		return { spreadsheetId, gid };
	} catch {
		return null;
	}
}

/**
 * Check if a URL is a Google Sheets URL
 */
export function isGoogleSheetsUrl(url: string): boolean {
	return parseGoogleSheetsUrl(url) !== null;
}

/**
 * Convert row index and column name to A1 notation (e.g., "A1", "B2")
 * @param rowIndex Zero-based row index
 * @param columnName Column name from CSV headers
 * @param headers Array of column headers in order
 */
export function convertToA1Notation(
	rowIndex: number,
	columnName: string,
	headers: string[],
): string {
	// Find column index
	const columnIndex = headers.indexOf(columnName);
	if (columnIndex === -1) {
		throw new Error(`Column "${columnName}" not found in headers`);
	}

	// Convert column index to letter (A, B, C, ..., Z, AA, AB, ...)
	let columnLetter = "";
	let col = columnIndex;
	while (col >= 0) {
		columnLetter = String.fromCharCode(65 + (col % 26)) + columnLetter;
		col = Math.floor(col / 26) - 1;
	}

	// A1 notation uses 1-based row numbers
	const rowNumber = rowIndex + 1;

	return `${columnLetter}${rowNumber}`;
}
