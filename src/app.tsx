import { Edit3, FileText, Keyboard, Link as LinkIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CellEditor } from "@/components/cell-editor";
import { ChangesViewer } from "@/components/changes-viewer";
import { ColumnSelector } from "@/components/column-selector";
import { DownloadButton } from "@/components/download-button";
import { FileDropZone } from "@/components/file-drop-zone";
import { LinkEditorModal } from "@/components/link-editor-modal";
import { LinksList } from "@/components/links-list";
import { Navigation } from "@/components/navigation";
import { RecordList } from "@/components/record-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCSVData } from "@/hooks/use-csv-data";
import { useLinkNavigation } from "@/hooks/use-link-navigation";
import { parseLinks, replaceLinkHref } from "@/lib/link-parser";

type SelectedLink = {
	href: string;
	index: number;
};

export default function App() {
	const {
		uploadResult,
		metadata,
		rows,
		loading,
		error,
		uploadFile,
		selectColumns,
		reset,
		loadRows,
		updateCell,
		clearError,
	} = useCSVData();

	const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
	const [selectedLink, setSelectedLink] = useState<SelectedLink | null>(null);
	const [column, setColumn] = useState<string>("");
	const [editorContent, setEditorContent] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const {
		currentLinkIndex,
		totalLinkRows,
		goToNextLink,
		goToPrevLink,
		hasNext,
		hasPrev,
		refreshLinkRows,
	} = useLinkNavigation(selectedRowIndex);

	// Set initial column when metadata loads
	useEffect(() => {
		if (metadata?.linkColumns?.length && !column) {
			setColumn(metadata.linkColumns[0]);
		}
	}, [metadata, column]);

	// Load initial rows when metadata is available
	useEffect(() => {
		if (metadata && metadata.totalRows > 0 && rows.size === 0) {
			// Load first batch of rows
			loadRows(0, 50);
		}
	}, [metadata, rows.size, loadRows]);

	const selectedRow =
		selectedRowIndex !== null ? rows.get(selectedRowIndex) : null;

	const handleLinkClick = useCallback((href: string, linkIndex: number) => {
		setSelectedLink({ href, index: linkIndex });
	}, []);

	const handleLinkSave = useCallback(
		async (newHref: string) => {
			if (selectedRowIndex === null || !selectedLink) return;

			const updatedHtml = replaceLinkHref(
				editorContent,
				selectedLink.index,
				newHref,
			);

			const success = await updateCell(selectedRowIndex, column, updatedHtml);
			if (success) {
				setEditorContent(updatedHtml);
				refreshLinkRows();
				setSelectedLink(null);
			}
		},
		[
			selectedRowIndex,
			selectedLink,
			editorContent,
			column,
			updateCell,
			refreshLinkRows,
		],
	);

	const handlePrev = useCallback(async () => {
		const prevRow = await goToPrevLink();
		if (prevRow !== null) {
			setSelectedRowIndex(prevRow);
			setSelectedLink(null);
		}
	}, [goToPrevLink]);

	const handleNext = useCallback(async () => {
		const nextRow = await goToNextLink();
		if (nextRow !== null) {
			setSelectedRowIndex(nextRow);
			setSelectedLink(null);
		}
	}, [goToNextLink]);

	// Sequential navigation - move one row at a time
	const handlePrevSequential = useCallback(() => {
		if (selectedRowIndex === null) {
			if (metadata && metadata.totalRows > 0) {
				setSelectedRowIndex(metadata.totalRows - 1);
				setSelectedLink(null);
			}
			return;
		}
		if (selectedRowIndex > 0) {
			setSelectedRowIndex(selectedRowIndex - 1);
			setSelectedLink(null);
		}
	}, [selectedRowIndex, metadata]);

	const handleNextSequential = useCallback(() => {
		if (selectedRowIndex === null) {
			setSelectedRowIndex(0);
			setSelectedLink(null);
			return;
		}
		if (metadata && selectedRowIndex < metadata.totalRows - 1) {
			setSelectedRowIndex(selectedRowIndex + 1);
			setSelectedLink(null);
		}
	}, [selectedRowIndex, metadata]);

	const handleColumnChange = useCallback((newColumn: string) => {
		setColumn(newColumn);
		setSelectedLink(null);
	}, []);

	const handleStartOver = useCallback(() => {
		setSelectedRowIndex(null);
		setSelectedLink(null);
		setColumn("");
		reset();
	}, [reset]);

	// Keyboard navigation - arrow keys for prev/next record
	// Left/Right: always navigate between records (unless in input/textarea)
	// Up/Down: only navigate when NOT in editor (ProseMirror)
	useEffect(() => {
		if (!metadata || selectedLink !== null) return; // Don't navigate when modal is open

		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;

			// Don't intercept when typing in an input or textarea
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// Check if we're inside the Tiptap editor (ProseMirror)
			const isInEditor = target.closest(".ProseMirror") !== null;

			// Arrow keys: navigate sequentially one row at a time (unless in input/editor)
			if (e.key === "ArrowLeft" && !isInEditor) {
				e.preventDefault();
				handlePrevSequential();
			} else if (e.key === "ArrowRight" && !isInEditor) {
				e.preventDefault();
				handleNextSequential();
			} else if (e.key === "ArrowUp" && !isInEditor) {
				e.preventDefault();
				handlePrevSequential();
			} else if (e.key === "ArrowDown" && !isInEditor) {
				e.preventDefault();
				handleNextSequential();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [metadata, selectedLink, handlePrevSequential, handleNextSequential]);

	// Get available link columns from metadata
	const linkColumns = metadata?.linkColumns || [];

	// Sync editor content when row or column changes
	useEffect(() => {
		const html = selectedRow?.[column] || "";
		setEditorContent(html);
	}, [selectedRow, column]);

	// Handle editor content change (called from CellEditor with debounce)
	const handleEditorChange = useCallback(
		async (html: string) => {
			if (selectedRowIndex === null || !column) return;

			// Check if content actually changed before saving
			const currentContent = selectedRow?.[column] || "";
			if (html === currentContent) {
				// Content hasn't changed, don't save
				return;
			}

			setEditorContent(html);
			setIsSaving(true);

			// Clear any pending save
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Save after a short delay to batch rapid changes
			saveTimeoutRef.current = setTimeout(async () => {
				const success = await updateCell(selectedRowIndex, column, html);
				if (success) {
					refreshLinkRows();
				}
				setIsSaving(false);
			}, 100);
		},
		[selectedRowIndex, column, selectedRow, updateCell, refreshLinkRows],
	);

	// Cleanup save timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	// Count links in current content
	const linksInCurrentContent = parseLinks(editorContent).length;

	// Step 1: No file uploaded - show drop zone
	if (!uploadResult) {
		return (
			<div className="h-svh flex flex-col bg-background">
				<main className="flex-1 flex items-center justify-center p-4">
					<div>
						<FileDropZone onFileLoaded={uploadFile} loading={loading} />
						{error && (
							<Alert variant="destructive" className="mt-4 max-w-xl mx-auto">
								<AlertDescription className="flex items-center justify-between">
									{error}
									<Button variant="ghost" size="icon-xs" onClick={clearError}>
										<X className="w-4 h-4" />
									</Button>
								</AlertDescription>
							</Alert>
						)}
					</div>
				</main>
			</div>
		);
	}

	// Step 2: File uploaded, but columns not selected
	if (!metadata) {
		return (
			<div className="h-svh flex flex-col bg-background">
				<main className="flex-1 flex items-center justify-center p-4">
					<div>
						<ColumnSelector
							columns={uploadResult.columns}
							fileName={uploadResult.fileName}
							totalRows={uploadResult.totalRows}
							onConfirm={selectColumns}
							onCancel={handleStartOver}
							loading={loading}
						/>
						{error && (
							<Alert variant="destructive" className="mt-4 max-w-2xl mx-auto">
								<AlertDescription className="flex items-center justify-between">
									{error}
									<Button variant="ghost" size="icon-xs" onClick={clearError}>
										<X className="w-4 h-4" />
									</Button>
								</AlertDescription>
							</Alert>
						)}
					</div>
				</main>
			</div>
		);
	}

	// Step 3: Ready to edit
	return (
		<div className="h-svh flex flex-col bg-background">
			<header className="border-b bg-card p-4 flex justify-between items-center">
				<div className="flex items-center gap-4">
					<h1 className="text-xl font-bold text-foreground">CSV HTML Editor</h1>
					<span className="text-sm text-muted-foreground">
						{metadata.totalRows.toLocaleString()} rows &middot;{" "}
						{metadata.fileName}
					</span>
					<Button variant="secondary" size="sm" onClick={handleStartOver}>
						Load different file
					</Button>
				</div>
				<div className="flex gap-4 items-center">
					<Badge variant="secondary" className="gap-1">
						<Keyboard className="size-3" />
						<span className="hidden sm:inline">← → ↑ ↓ navigate records</span>
						<span className="sm:hidden">← → ↑ ↓</span>
					</Badge>
					<Navigation
						currentRow={selectedRowIndex}
						currentLinkIndex={currentLinkIndex}
						totalLinkRows={totalLinkRows}
						hasNext={hasNext}
						hasPrev={hasPrev}
						onPrev={handlePrev}
						onNext={handleNext}
					/>
					<ChangesViewer
						isDirty={metadata.isDirty}
						dirtyCount={metadata.dirtyCount}
					/>
					<DownloadButton
						isDirty={metadata.isDirty}
						dirtyCount={metadata.dirtyCount}
						fileName={metadata.fileName}
					/>
					<ThemeToggle />
				</div>
			</header>

			{error && (
				<Alert variant="destructive" className="m-4">
					<AlertDescription className="flex items-center justify-between">
						{error}
						<Button variant="ghost" size="icon-xs" onClick={clearError}>
							<X className="w-4 h-4" />
						</Button>
					</AlertDescription>
				</Alert>
			)}

			<main className="flex-1 overflow-hidden">
				<ResizablePanelGroup direction="horizontal" className="h-full">
					{/* Left: Record List */}
					<ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
						<div className="h-full border-r bg-card overflow-hidden flex flex-col">
							<div className="p-3 h-16 border-b bg-muted/70 text-sm font-medium text-muted-foreground flex items-center gap-2">
								<FileText className="w-4 h-4" />
								Records ({metadata.totalRows.toLocaleString()})
							</div>
							<div className="flex-1 overflow-hidden">
								<RecordList
									totalRows={metadata.totalRows}
									selectedIndex={selectedRowIndex}
									onSelect={(idx) => {
										setSelectedRowIndex(idx);
										setSelectedLink(null);
									}}
									loadRows={loadRows}
									rows={rows}
									titleColumn={
										metadata.columns.includes("Title")
											? "Title"
											: metadata.columns[0]
									}
								/>
							</div>
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Center: Editor */}
					<ResizablePanel defaultSize={50} minSize={30}>
						<div className="h-full flex flex-col overflow-hidden bg-card">
							{selectedRow ? (
								<>
									<div className="p-3 min-h-16 border-b bg-muted/70 flex items-center gap-4">
										<div className="flex items-center gap-2">
											<Edit3 className="w-4 h-4 text-muted-foreground" />
											<span className="text-sm font-medium text-muted-foreground">
												Column:
											</span>
										</div>
										<Select value={column} onValueChange={handleColumnChange}>
											<SelectTrigger className="w-[200px] bg-background">
												<SelectValue placeholder="Select column" />
											</SelectTrigger>
											<SelectContent>
												{linkColumns.map((col) => (
													<SelectItem key={col} value={col}>
														{col}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<CellEditor
										content={editorContent}
										onChange={handleEditorChange}
										isSaving={isSaving}
									/>
								</>
							) : (
								<div className="flex-1 flex items-center justify-center text-muted-foreground">
									<div className="text-center">
										<p className="text-lg mb-2">Select a record to edit</p>
										<p className="text-sm">
											or use arrow keys / navigation buttons
										</p>
									</div>
								</div>
							)}
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Right: Links List */}
					<ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
						<div className="h-full border-l bg-card overflow-hidden flex flex-col">
							<div className="p-3 h-16 border-b bg-muted/70 text-sm font-medium text-muted-foreground flex items-center gap-2">
								<LinkIcon className="w-4 h-4" />
								Links ({linksInCurrentContent})
							</div>
							<ScrollArea className="flex-1">
								{selectedRow ? (
									<LinksList
										html={editorContent}
										selectedLinkIndex={selectedLink?.index}
										onLinkClick={handleLinkClick}
									/>
								) : (
									<div className="p-4 text-muted-foreground text-sm italic">
										Select a record to see links
									</div>
								)}
							</ScrollArea>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</main>

			{/* Link Editor Modal */}
			<LinkEditorModal
				isOpen={selectedLink !== null}
				href={selectedLink?.href || ""}
				onSave={handleLinkSave}
				onClose={() => setSelectedLink(null)}
			/>
		</div>
	);
}
