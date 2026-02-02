import DOMPurify from "dompurify";
import { ChevronDown, ChevronUp, Code, Eye, History } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as api from "@/lib/api";
import { createDiffView } from "@/lib/html-diff";

type ChangesViewerProps = {
	isDirty: boolean;
	dirtyCount: number;
};

export function ChangesViewer({ isDirty, dirtyCount }: ChangesViewerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [changes, setChanges] = useState<api.CellChange[]>([]);
	const [loading, setLoading] = useState(false);

	const loadChanges = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.getChanges();
			// Sort by timestamp, most recent first
			setChanges(data.sort((a, b) => b.timestamp - a.timestamp));
		} catch (err) {
			console.error("Failed to load changes:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			loadChanges();
		}
	}, [isOpen, loadChanges]);

	const formatTimestamp = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString();
	};

	const sanitizeHtml = useCallback((html: string) => {
		return DOMPurify.sanitize(html, {
			ALLOWED_TAGS: [
				"a",
				"p",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"ul",
				"ol",
				"li",
				"strong",
				"em",
				"b",
				"i",
				"u",
				"br",
				"img",
				"div",
				"span",
				"blockquote",
				"pre",
				"code",
			],
			ALLOWED_ATTR: ["href", "target", "src", "alt", "class", "id"],
		});
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger>
				<Button variant="outline" size="sm" disabled={!isDirty}>
					<History className="w-4 h-4 mr-2" />
					View Changes ({dirtyCount})
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-6xl max-h-[85vh] h-full w-full flex flex-col">
				<DialogHeader>
					<DialogTitle>All Changes Made in This Session</DialogTitle>
					<DialogDescription>
						{changes.length === 0
							? "No changes have been made yet."
							: `${changes.length} cell${changes.length === 1 ? "" : "s"} modified`}
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="flex-1 pr-4">
					{loading ? (
						<div className="flex items-center justify-center py-8 text-muted-foreground">
							Loading changes...
						</div>
					) : changes.length === 0 ? (
						<div className="flex items-center justify-center py-8 text-muted-foreground">
							No changes to display
						</div>
					) : (
						<div className="space-y-4">
							{changes.map((change) => (
								<ChangeItem
									key={`${change.rowIndex}-${change.column}-${change.timestamp}`}
									change={change}
									sanitizeHtml={sanitizeHtml}
									formatTimestamp={formatTimestamp}
								/>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}

type ChangeItemProps = {
	change: api.CellChange;
	sanitizeHtml: (html: string) => string;
	formatTimestamp: (timestamp: number) => string;
};

function ChangeItem({
	change,
	sanitizeHtml,
	formatTimestamp,
}: ChangeItemProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

	const oldLength = change.oldValue?.length || 0;
	const newLength = change.newValue?.length || 0;
	const lengthDiff = newLength - oldLength;

	// Create diffed HTML for highlighting changes
	const { oldHtmlDiffed, newHtmlDiffed } = useMemo(() => {
		try {
			return createDiffView(change.oldValue || "", change.newValue || "");
		} catch (err) {
			console.error("Error creating diff:", err);
			return {
				oldHtmlDiffed: change.oldValue || "",
				newHtmlDiffed: change.newValue || "",
			};
		}
	}, [change.oldValue, change.newValue]);

	return (
		<div className="border rounded-lg bg-card overflow-hidden">
			{/* Header */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					{isExpanded ? (
						<ChevronUp className="w-4 h-4 text-muted-foreground" />
					) : (
						<ChevronDown className="w-4 h-4 text-muted-foreground" />
					)}
					<Badge variant="secondary">Row #{change.rowIndex + 1}</Badge>
					<Badge variant="outline">{change.column}</Badge>
					<span className="text-xs text-muted-foreground">
						{formatTimestamp(change.timestamp)}
					</span>
					{lengthDiff !== 0 && (
						<Badge
							variant={lengthDiff > 0 ? "default" : "secondary"}
							className="text-xs"
						>
							{lengthDiff > 0 ? "+" : ""}
							{lengthDiff} chars
						</Badge>
					)}
				</div>
			</button>

			{/* Content */}
			{isExpanded && (
				<div className="p-4 pt-0 space-y-4">
					{/* View Mode Toggle */}
					<div className="flex gap-2 border-b pb-2">
						<Button
							variant={viewMode === "preview" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("preview")}
							className="h-7"
						>
							<Eye className="w-3 h-3 mr-1" />
							Preview
						</Button>
						<Button
							variant={viewMode === "code" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("code")}
							className="h-7"
						>
							<Code className="w-3 h-3 mr-1" />
							Code
						</Button>
					</div>

					{/* Comparison */}
					<div className="grid grid-cols-2 gap-4">
						{/* Old Value */}
						<div className="flex-1">
							<div className="flex items-center justify-between mb-2">
								<div className="text-xs font-medium text-destructive">
									Old Value
								</div>
								<span className="text-xs text-muted-foreground">
									{oldLength} chars
								</span>
							</div>
							<div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5 min-h-[100px] max-h-[300px] overflow-auto">
								{change.oldValue ? (
									viewMode === "preview" ? (
										<div
											className="prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline html-diff-container"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized HTML with diff markers
											dangerouslySetInnerHTML={{
												__html: sanitizeHtml(oldHtmlDiffed),
											}}
										/>
									) : (
										<pre className="text-xs wrap-break-word whitespace-pre-wrap font-mono">
											{change.oldValue}
										</pre>
									)
								) : (
									<span className="italic text-muted-foreground text-sm">
										(empty)
									</span>
								)}
							</div>
						</div>

						{/* New Value */}
						<div className="flex-1">
							<div className="flex items-center justify-between mb-2">
								<div className="text-xs font-medium text-primary">
									New Value
								</div>
								<span className="text-xs text-muted-foreground">
									{newLength} chars
								</span>
							</div>
							<div className="border border-primary/30 rounded-lg p-3 bg-primary/5 min-h-[100px] max-h-[300px] overflow-auto">
								{change.newValue ? (
									viewMode === "preview" ? (
										<div
											className="prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline html-diff-container"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized HTML with diff markers
											dangerouslySetInnerHTML={{
												__html: sanitizeHtml(newHtmlDiffed),
											}}
										/>
									) : (
										<pre className="text-xs wrap-break-word whitespace-pre-wrap font-mono">
											{change.newValue}
										</pre>
									)
								) : (
									<span className="italic text-muted-foreground text-sm">
										(empty)
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
