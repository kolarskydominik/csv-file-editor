import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getDownloadUrl, saveToGoogleSheet } from "@/lib/api";

type DownloadButtonProps = {
	isDirty: boolean;
	dirtyCount: number;
	fileName: string;
	googleSpreadsheetId?: string | null;
};

export function DownloadButton({
	isDirty,
	dirtyCount,
	fileName,
	googleSpreadsheetId,
}: DownloadButtonProps) {
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = getDownloadUrl();
		link.download = fileName.replace(".csv", "-modified.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleSaveToGoogleSheets = async () => {
		if (!googleSpreadsheetId) return;

		setSaving(true);
		setSaveError(null);
		setSaveSuccess(false);

		try {
			await saveToGoogleSheet();
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (error) {
			setSaveError(
				error instanceof Error
					? error.message
					: "Failed to save to Google Sheets",
			);
			setTimeout(() => setSaveError(null), 5000);
		} finally {
			setSaving(false);
		}
	};

	const hasGoogleSheet = !!googleSpreadsheetId;

	return (
		<div className="flex items-center gap-2">
			{/* Download CSV button - always visible */}
			<Button
				onClick={handleDownload}
				disabled={!isDirty}
				variant={isDirty ? "default" : "secondary"}
			>
				<Download className="w-4 h-4" />
				{isDirty ? `Download (${dirtyCount} changed)` : "No changes"}
			</Button>

			{/* Save to Google Sheets button - only when loaded from Google Sheets */}
			{hasGoogleSheet && (
				<Button
					onClick={handleSaveToGoogleSheets}
					disabled={!isDirty || saving}
					variant={isDirty ? "default" : "secondary"}
					className="gap-2"
				>
					<FileSpreadsheet className="w-4 h-4" />
					{saving
						? "Saving..."
						: saveSuccess
							? "Saved!"
							: isDirty
								? `Save to Sheets (${dirtyCount} changed)`
								: "No changes"}
				</Button>
			)}

			{/* Error message */}
			{saveError && (
				<Alert
					variant="destructive"
					className="absolute top-16 right-4 max-w-md"
				>
					<AlertDescription>{saveError}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
