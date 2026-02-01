import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseLinks } from "@/lib/link-parser";
import { cn } from "@/lib/utils";

type LinksListProps = {
	html: string;
	selectedLinkIndex?: number;
	onLinkClick: (href: string, index: number) => void;
};

export function LinksList({
	html,
	selectedLinkIndex,
	onLinkClick,
}: LinksListProps) {
	const links = useMemo(() => parseLinks(html), [html]);

	if (links.length === 0) {
		return (
			<div className="p-4 text-muted-foreground text-sm italic">
				No links in this cell
			</div>
		);
	}

	const getTextAfterLink = (
		_startIndex: number,
		endIndex: number,
		html: string,
	) => {
		const afterTag = html.slice(endIndex);
		const closeTagIndex = afterTag.indexOf("</a>");
		if (closeTagIndex === -1) return "";
		return afterTag
			.slice(0, closeTagIndex)
			.replace(/<[^>]*>/g, "")
			.trim();
	};

	return (
		<div className="divide-y divide-border">
			{links.map((link, index) => {
				const linkText = getTextAfterLink(link.startIndex, link.endIndex, html);
				const isSelected = index === selectedLinkIndex;

				const handleOpenInNewTab = (e: React.MouseEvent) => {
					e.stopPropagation();
					if (link.href) {
						window.open(link.href, "_blank", "noopener,noreferrer");
					}
				};

				const isValidUrl =
					link.href &&
					(link.href.startsWith("http://") ||
						link.href.startsWith("https://") ||
						link.href.startsWith("mailto:") ||
						link.href.startsWith("tel:"));

				return (
					<div
						key={`link-${index}-${link.href}`}
						className={cn(
							"w-full p-3 hover:bg-accent/40 transition-colors border-l-4 border-transparent flex items-start gap-2",
							isSelected && "bg-primary/10 border-l-4 border-l-primary",
						)}
					>
						<button
							type="button"
							onClick={() => onLinkClick(link.href, index)}
							className="flex-1 text-left min-w-0"
						>
							<div className="flex items-start gap-2">
								<Badge variant="secondary" className="shrink-0 mt-0.5">
									{index + 1}
								</Badge>
								<div className="min-w-0 flex-1">
									{linkText && (
										<div
											className="text-sm font-medium text-foreground truncate mb-1"
											title={linkText}
										>
											{linkText}
										</div>
									)}
									<div
										className="text-xs text-primary truncate font-mono"
										title={link.href}
									>
										{link.href}
									</div>
								</div>
							</div>
						</button>
						{isValidUrl && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={handleOpenInNewTab}
								title="Open in new tab"
								aria-label="Open link in new tab"
							>
								<ExternalLink className="w-4 h-4" />
							</Button>
						)}
					</div>
				);
			})}
		</div>
	);
}
