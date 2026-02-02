import MarkdownPreview from "@uiw/react-markdown-preview";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type FeaturesModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function FeaturesModal({ isOpen, onClose }: FeaturesModalProps) {
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen) {
			setLoading(true);
			fetch("/FEATURES.md")
				.then((res) => res.text())
				.then((text) => {
					setContent(text);
					setLoading(false);
				})
				.catch((err) => {
					console.error("Failed to load features:", err);
					setContent("# Error\n\nFailed to load features guide.");
					setLoading(false);
				});
		}
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Features Guide</DialogTitle>
				</DialogHeader>
				<ScrollArea className="flex-1 pr-4">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">Loading...</p>
						</div>
					) : (
						<div className="py-2">
							<MarkdownPreview
								source={content}
								style={{
									backgroundColor: "transparent",
									color: "inherit",
								}}
								className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:first:mt-0 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:mb-4 [&_ul]:ml-4 [&_hr]:my-6 [&_hr]:border-border"
							/>
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
