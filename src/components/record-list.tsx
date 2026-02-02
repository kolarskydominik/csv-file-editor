import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type RecordListProps = {
	totalRows: number;
	selectedIndex: number | null;
	onSelect: (index: number) => void;
	loadRows: (start: number, count: number) => Promise<void>;
	rows: Map<number, Record<string, string>>;
	titleColumn?: string;
};

export function RecordList({
	totalRows,
	selectedIndex,
	onSelect,
	loadRows,
	rows,
	titleColumn = "Title",
}: RecordListProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Filter rows based on search query
	const filteredIndices = useMemo(() => {
		if (!searchQuery.trim()) {
			// No search query, return all indices
			return Array.from({ length: totalRows }, (_, i) => i);
		}

		const query = searchQuery.toLowerCase().trim();
		const indices: number[] = [];

		// Search through loaded rows
		for (let i = 0; i < totalRows; i++) {
			const row = rows.get(i);
			if (!row) continue;

			// Search through all column values
			const matches = Object.values(row).some((value) =>
				value?.toLowerCase().includes(query),
			);

			if (matches) {
				indices.push(i);
			}
		}

		return indices;
	}, [searchQuery, totalRows, rows]);

	const filteredCount = filteredIndices.length;

	const virtualizer = useVirtualizer({
		count: filteredCount,
		getScrollElement: () => containerRef.current,
		estimateSize: () => 56,
		overscan: 10,
	});

	const items = virtualizer.getVirtualItems();

	// Load rows as user scrolls
	const loadVisibleRows = useCallback(() => {
		if (items.length === 0) {
			// If no items are visible yet, load the first batch
			if (filteredCount > 0) {
				const firstRealIndex = filteredIndices[0];
				loadRows(firstRealIndex, 50);
			}
			return;
		}
		const firstFilteredIndex = items[0].index;
		const lastFilteredIndex = items[items.length - 1].index;
		const firstRealIndex = filteredIndices[firstFilteredIndex];
		const lastRealIndex = filteredIndices[lastFilteredIndex];
		const startIndex = Math.max(0, firstRealIndex - 10);
		const endIndex = lastRealIndex + 10;
		loadRows(startIndex, endIndex - startIndex + 1);
	}, [items, loadRows, filteredCount, filteredIndices]);

	useEffect(() => {
		loadVisibleRows();
	}, [loadVisibleRows]);

	// Also load initial rows when component mounts and totalRows is available
	useEffect(() => {
		if (totalRows > 0 && rows.size === 0) {
			loadRows(0, 50);
		}
	}, [totalRows, rows.size, loadRows]);

	// Load rows when search changes to ensure filtered results are available
	useEffect(() => {
		if (searchQuery.trim() && filteredIndices.length > 0) {
			// Load all filtered rows
			const indicesToLoad = filteredIndices.slice(
				0,
				Math.min(100, filteredIndices.length),
			);
			for (const index of indicesToLoad) {
				if (!rows.has(index)) {
					loadRows(index, 1);
				}
			}
		}
	}, [searchQuery, filteredIndices, rows, loadRows]);

	// Scroll to selected row (map to filtered index if searching)
	useEffect(() => {
		if (selectedIndex !== null && filteredCount > 0) {
			const filteredIndex = filteredIndices.indexOf(selectedIndex);
			if (filteredIndex !== -1) {
				virtualizer.scrollToIndex(filteredIndex, { align: "center" });
			}
		}
	}, [selectedIndex, virtualizer, filteredIndices, filteredCount]);

	if (totalRows === 0) {
		return (
			<div className="h-full flex items-center justify-center text-gray-500">
				No data loaded
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-hidden">
			{/* Search Input */}
			<div className="p-3 border-b bg-muted/30">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search records..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-8 text-sm"
						aria-label="Search records"
					/>
				</div>
				{searchQuery.trim() && (
					<div className="mt-2 text-xs text-muted-foreground">
						{filteredCount} of {totalRows} records
					</div>
				)}
			</div>

			{/* Virtualized List */}
			{filteredCount === 0 && searchQuery.trim() ? (
				<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
					No records found
				</div>
			) : (
				<div ref={containerRef} className="flex-1 overflow-auto">
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							position: "relative",
						}}
					>
						{items.map((virtualItem) => {
							const filteredIndex = virtualItem.index;
							const realIndex = filteredIndices[filteredIndex];
							const row = rows.get(realIndex);
							const title =
								row?.[titleColumn] || row?.["Slug"] || `Row ${realIndex + 1}`;

							return (
								// biome-ignore lint/a11y/useSemanticElements: Using div for virtualization performance
								<div
									key={realIndex}
									role="button"
									onClick={() => onSelect(realIndex)}
									className={`absolute w-full px-4 py-3 border-b border-l-4  border-border/60 cursor-pointer transition-colors ${
										selectedIndex === realIndex
											? "bg-primary/10 border-l-4 border-l-primary"
											: "hover:bg-accent/50"
									}`}
									style={{
										height: `${virtualItem.size}px`,
										transform: `translateY(${virtualItem.start}px)`,
									}}
									aria-label={`Select record ${realIndex + 1}: ${title}`}
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											onSelect(realIndex);
										}
									}}
								>
									<div className="text-xs text-gray-400 mb-0.5">
										#{realIndex + 1}
									</div>
									<div className="text-sm font-medium truncate" title={title}>
										{title}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
