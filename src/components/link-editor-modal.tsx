import { ExternalLink, TestTube } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type LinkEditorModalProps = {
	isOpen: boolean;
	href: string;
	onSave: (newHref: string) => void;
	onClose: () => void;
};

export function LinkEditorModal({
	isOpen,
	href,
	onSave,
	onClose,
}: LinkEditorModalProps) {
	const [value, setValue] = useState(href);
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();

	useEffect(() => {
		if (isOpen) {
			setValue(href);
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 50);
		}
	}, [isOpen, href]);

	const handleSave = () => {
		onSave(value);
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		}
	};

	const handleOpenInNewTab = () => {
		if (value) {
			window.open(value, "_blank", "noopener,noreferrer");
		}
	};

	const handleTestRelativePath = () => {
		if (value) {
			try {
				// Construct absolute URL from relative path using BritishTheatre.com as base
				const baseUrl = "https://www.britishtheatre.com/";
				const absoluteUrl = new URL(value, baseUrl).href;
				window.open(absoluteUrl, "_blank", "noopener,noreferrer");
			} catch {
				// If URL construction fails, try opening as-is
				window.open(value, "_blank", "noopener,noreferrer");
			}
		}
	};

	const isModified = value !== href;
	const isValidUrl =
		value &&
		(value.startsWith("http://") ||
			value.startsWith("https://") ||
			value.startsWith("mailto:") ||
			value.startsWith("tel:"));

	const isRelativePath =
		value && !isValidUrl && value.startsWith("/") && value.trim().length > 0;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Link URL</DialogTitle>
					<DialogDescription>
						Modify the URL for this link. Press Enter to save or Escape to
						cancel.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<label htmlFor={inputId} className="text-sm font-medium">
						URL
					</label>
					<Input
						id={inputId}
						ref={inputRef}
						type="url"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKeyDown}
						className="font-mono"
						placeholder="https://..."
					/>
				</div>

				<DialogFooter className="flex items-center justify-between">
					<div className="flex gap-2 mr-auto">
						{isRelativePath ? (
							<Button
								variant="link"
								onClick={handleTestRelativePath}
								className="gap-2"
							>
								<ExternalLink className="size-4" />
								TEST: BT Relative Path
							</Button>
						) : (
							<Button
								variant="link"
								onClick={handleOpenInNewTab}
								disabled={!isValidUrl}
								className="gap-2"
							>
								<ExternalLink className="size-4" />
								Open in New Tab
							</Button>
						)}
					</div>

					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!isModified}>
							Apply
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
