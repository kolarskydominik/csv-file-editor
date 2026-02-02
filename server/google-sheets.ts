/**
 * Google Sheets API v4 integration
 */

import { google } from "googleapis";
import Papa from "papaparse";

/**
 * Get sheet data from Google Sheets API
 */
export async function getSheetData(
	spreadsheetId: string,
	range: string,
	accessToken: string,
): Promise<{
	values: any[][];
	headers: string[];
}> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const sheets = google.sheets({ version: "v4", auth });

	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range,
		});

		const values = response.data.values || [];

		if (values.length === 0) {
			throw new Error("Sheet is empty");
		}

		// First row is headers
		const headers = values[0].map((h: any) => String(h || ""));

		// Data rows (skip header row)
		const dataRows = values.slice(1);

		return {
			values: dataRows,
			headers,
		};
	} catch (error: any) {
		if (error.code === 404) {
			throw new Error("Sheet not found or you do not have access");
		}
		if (error.code === 403) {
			throw new Error(
				"Permission denied. Please ensure you have access to this sheet.",
			);
		}
		throw new Error(`Failed to load sheet: ${error.message}`);
	}
}

/**
 * Convert Google Sheets data to CSV format
 */
export function convertToCSV(headers: string[], dataRows: any[][]): string {
	// Create array of objects for PapaParse
	const data = dataRows.map((row) => {
		const obj: Record<string, string> = {};
		headers.forEach((header, index) => {
			obj[header] = String(row[index] || "");
		});
		return obj;
	});

	return Papa.unparse(data, { columns: headers });
}

/**
 * Get sheet name from GID (tab ID)
 * If GID is not provided, returns the first sheet name
 */
export async function getSheetName(
	spreadsheetId: string,
	gid: string | null,
	accessToken: string,
): Promise<string> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const sheets = google.sheets({ version: "v4", auth });

	try {
		const response = await sheets.spreadsheets.get({
			spreadsheetId,
		});

		const sheetsList = response.data.sheets || [];

		if (gid) {
			// Find sheet by GID
			const sheet = sheetsList.find(
				(s) => String(s.properties?.sheetId) === gid,
			);
			if (sheet?.properties?.title) {
				return sheet.properties.title;
			}
		}

		// Return first sheet name if GID not found or not provided
		if (sheetsList[0]?.properties?.title) {
			return sheetsList[0].properties.title;
		}

		return "Sheet1";
	} catch (error: any) {
		console.error("Failed to get sheet name:", error);
		return "Sheet1";
	}
}

/**
 * Update cells in Google Sheets using batch update
 */
export async function updateSheetCells(
	spreadsheetId: string,
	sheetName: string,
	updates: Array<{ range: string; value: string }>,
	accessToken: string,
): Promise<number> {
	if (updates.length === 0) {
		return 0;
	}

	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const sheets = google.sheets({ version: "v4", auth });

	try {
		// Prepare batch update requests
		const data = updates.map((update) => ({
			range: `${sheetName}!${update.range}`,
			values: [[update.value]],
		}));

		await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId,
			requestBody: {
				valueInputOption: "RAW",
				data,
			},
		});

		return updates.length;
	} catch (error: any) {
		if (error.code === 404) {
			throw new Error("Sheet not found or you do not have access");
		}
		if (error.code === 403) {
			throw new Error(
				"Permission denied. Please ensure you have write access to this sheet.",
			);
		}
		throw new Error(`Failed to update sheet: ${error.message}`);
	}
}
