import { FileSpreadsheet, LogOut, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	checkGoogleAuth,
	getGoogleAuthUrl,
	loadGoogleSheet,
	logoutGoogle,
} from "@/lib/api";
import { isGoogleSheetsUrl, parseGoogleSheetsUrl } from "@/lib/google-sheets";

type FileDropZoneProps = {
	onFileLoaded: (content: string, fileName: string) => void;
	onGoogleSheetLoaded?: (result: {
		success: boolean;
		totalRows: number;
		columns: string[];
		fileName: string;
	}) => void;
	loading: boolean;
};

export function FileDropZone({
	onFileLoaded,
	onGoogleSheetLoaded,
	loading,
}: FileDropZoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mode, setMode] = useState<"csv" | "google">("csv");
	const [googleUrl, setGoogleUrl] = useState("");
	const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const googleUrlId = useId();
	const csvFileInputRef = useRef<HTMLInputElement>(null);

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

	// Check Google authentication status
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const { authenticated } = await checkGoogleAuth();
				setIsGoogleAuthenticated(authenticated);
			} catch {
				setIsGoogleAuthenticated(false);
			} finally {
				setCheckingAuth(false);
			}
		};
		checkAuth();
	}, []);

	// Handle OAuth redirect
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const authStatus = params.get("google_auth");
		if (authStatus === "success") {
			setIsGoogleAuthenticated(true);
			setError(null);
			// Clean URL
			window.history.replaceState({}, "", window.location.pathname);
		} else if (authStatus === "error") {
			const message = params.get("message");
			setError(message || "Authentication failed");
			// Clean URL
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, []);

	const handleAuthenticate = useCallback(async () => {
		try {
			setError(null);
			const { authUrl } = await getGoogleAuthUrl();
			window.location.href = authUrl;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to initiate authentication",
			);
		}
	}, []);

	const handleLogout = useCallback(async () => {
		try {
			await logoutGoogle();
			setIsGoogleAuthenticated(false);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to logout");
		}
	}, []);

	const handleLoadGoogleSheet = useCallback(async () => {
		if (!googleUrl.trim()) {
			setError("Please enter a Google Sheets URL");
			return;
		}

		if (!isGoogleSheetsUrl(googleUrl)) {
			setError("Invalid Google Sheets URL");
			return;
		}

		if (!isGoogleAuthenticated) {
			setError("Please authenticate with Google first");
			return;
		}

		try {
			setError(null);
			const parsed = parseGoogleSheetsUrl(googleUrl);
			if (!parsed) {
				setError("Failed to parse Google Sheets URL");
				return;
			}

			const result = await loadGoogleSheet(parsed.spreadsheetId, parsed.gid);
			if (onGoogleSheetLoaded) {
				onGoogleSheetLoaded(result);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load Google Sheet",
			);
		}
	}, [googleUrl, isGoogleAuthenticated, onGoogleSheetLoaded]);

	return (
		<Card className="max-w-xl mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">CSV HTML Editor</CardTitle>
				<CardDescription>
					Edit HTML in your CSV, then download or save back to Google Sheets
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Mode Tabs */}
				<div className="flex gap-2 mb-6">
					<Button
						variant={mode === "csv" ? "default" : "outline"}
						onClick={() => setMode("csv")}
						className="flex-1"
						disabled={loading}
					>
						<Upload className="w-4 h-4 mr-2" />
						Upload CSV
					</Button>
					<Button
						variant={mode === "google" ? "default" : "outline"}
						onClick={() => setMode("google")}
						className="flex-1"
						disabled={loading}
					>
						<FileSpreadsheet className="w-4 h-4 mr-2" />
						Google Sheets
					</Button>
				</div>

				{/* CSV Upload Mode */}
				{mode === "csv" && (
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

						<div>
							<input
								ref={csvFileInputRef}
								type="file"
								accept=".csv"
								onChange={handleFileInput}
								className="hidden"
								disabled={loading}
								aria-label="Browse CSV files"
							/>
							<Button
								onClick={() => csvFileInputRef.current?.click()}
								disabled={loading}
							>
								Browse Files
							</Button>
						</div>
					</div>
				)}

				{/* Google Sheets Mode */}
				{mode === "google" && (
					<div className="space-y-4">
						{checkingAuth ? (
							<div className="text-center py-8 text-muted-foreground">
								Checking authentication...
							</div>
						) : (
							<>
								{isGoogleAuthenticated ? (
									<div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg mb-4">
										<span className="text-sm text-green-700 dark:text-green-300">
											✓ Connected to Google
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleLogout}
											disabled={loading}
										>
											<LogOut className="w-4 h-4 mr-2" />
											Disconnect
										</Button>
									</div>
								) : (
									<div className="text-center py-4">
										<p className="text-sm text-muted-foreground mb-4">
											Authenticate with Google to load private sheets
										</p>
										<Button onClick={handleAuthenticate} disabled={loading}>
											<FileSpreadsheet className="w-4 h-4 mr-2" />
											Authenticate with Google
										</Button>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor={googleUrlId}>Google Sheets URL</Label>
									<Input
										id={googleUrlId}
										type="url"
										placeholder="https://docs.google.com/spreadsheets/d/..."
										value={googleUrl}
										onChange={(e) => setGoogleUrl(e.target.value)}
										disabled={loading || !isGoogleAuthenticated}
										className="w-full"
									/>
									<p className="text-xs text-muted-foreground">
										Paste the share URL of your Google Sheet
									</p>
								</div>

								<Button
									onClick={handleLoadGoogleSheet}
									disabled={
										loading || !isGoogleAuthenticated || !googleUrl.trim()
									}
									className="w-full"
								>
									{loading ? "Loading..." : "Load from Google Sheets"}
								</Button>
							</>
						)}
					</div>
				)}

				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
