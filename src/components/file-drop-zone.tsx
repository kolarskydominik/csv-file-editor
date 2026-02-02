import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type FileDropZoneProps = {
	onFileLoaded: (content: string, fileName: string) => void;
	loading: boolean;
};

export function FileDropZone({ onFileLoaded, loading }: FileDropZoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const processFile = useCallback(
		(file: File) => {
			setError(null);

			if (!file.name.endsWith(".csv")) {
				setError("Please drop a CSV file");
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				if (content) {
					onFileLoaded(content, file.name);
				}
			};
			reader.onerror = () => {
				setError("Failed to read file");
			};
			reader.readAsText(file);
		},
		[onFileLoaded],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				processFile(file);
			}
		},
		[processFile],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				processFile(file);
			}
		},
		[processFile],
	);

	return (
		<Card className="max-w-xl mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">CSV HTML Editor</CardTitle>
				<CardDescription>
					Edit HTML in your CSV, then download the modified file
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
            ${loading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
          `}
				>
					<Upload
						className={`w-16 h-16 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
						strokeWidth={1.5}
					/>

					<p className="text-lg text-foreground mb-2">
						{loading ? "Loading..." : "Drop your CSV file here"}
					</p>
					<p className="text-sm text-muted-foreground mb-4">or</p>

					<Button asChild disabled={loading}>
						<label className="cursor-pointer">
							Browse Files
							<input
								type="file"
								accept=".csv"
								onChange={handleFileInput}
								className="hidden"
								disabled={loading}
							/>
						</label>
					</Button>
				</div>

				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
