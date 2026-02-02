import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Check,
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Loader2,
	Redo,
	Underline as UnderlineIcon,
	Undo,
	Unlink,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TooltipState = {
	visible: boolean;
	tagName: string;
	x: number;
	y: number;
};

type CellEditorProps = {
	content: string;
	onChange: (html: string) => void;
	disabled?: boolean;
	isSaving?: boolean;
};

export function CellEditor({
	content,
	onChange,
	disabled = false,
	isSaving = false,
}: CellEditorProps) {
	const [linkUrl, setLinkUrl] = useState("");
	const [showLinkInput, setShowLinkInput] = useState(false);
	const [tooltip, setTooltip] = useState<TooltipState>({
		visible: false,
		tagName: "",
		x: 0,
		y: 0,
	});
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastContentRef = useRef(content);
	const editorContainerRef = useRef<HTMLElement>(null);
	const isUpdatingProgrammaticallyRef = useRef(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4],
				},
			}),
			Link.configure({
				defaultProtocol: "https",
				openOnClick: false,

				HTMLAttributes: {
					class: "text-primary underline cursor-pointer",
				},
			}),
			Underline,
		],
		content,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			// Don't trigger onChange if we're programmatically updating content
			if (isUpdatingProgrammaticallyRef.current) {
				return;
			}

			const html = editor.getHTML();

			// Debounce the onChange call
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				if (html !== lastContentRef.current) {
					lastContentRef.current = html;
					onChange(html);
				}
			}, 500);
		},
	});

	// Update editor content when external content changes
	useEffect(() => {
		if (editor && content !== lastContentRef.current) {
			isUpdatingProgrammaticallyRef.current = true;
			lastContentRef.current = content;
			editor.commands.setContent(content);
			// Reset flag after editor update completes
			// Use a small timeout to ensure onUpdate handler has finished if it fires synchronously
			const timeoutId = setTimeout(() => {
				isUpdatingProgrammaticallyRef.current = false;
			}, 10);
			return () => clearTimeout(timeoutId);
		}
	}, [content, editor]);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!editor) return;

			const target = e.target as HTMLElement;
			const editorElement = editor.view.dom;

			// Only show tooltip for elements inside the editor content
			if (!editorElement.contains(target)) {
				setTooltip((prev) => ({ ...prev, visible: false }));
				return;
			}

			// Skip if hovering over the editor wrapper itself
			if (
				target === editorElement ||
				target.classList.contains("ProseMirror")
			) {
				setTooltip((prev) => ({ ...prev, visible: false }));
				return;
			}

			// List of semantic HTML tags we want to show tooltips for
			const semanticTags = [
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"p",
				"a",
				"strong",
				"b",
				"em",
				"i",
				"u",
				"ul",
				"ol",
				"li",
				"blockquote",
				"code",
				"pre",
				"br",
				"hr",
				"img",
				"table",
				"tr",
				"td",
				"th",
			];

			// Walk up the DOM tree to find a semantic HTML tag
			let currentElement: HTMLElement | null = target;
			let foundTag: string | null = null;

			while (currentElement && currentElement !== editorElement) {
				const tagName = currentElement.tagName.toLowerCase();

				// Check if this is a semantic tag we care about
				if (semanticTags.includes(tagName)) {
					foundTag = tagName;
					break;
				}

				// Stop if we hit the ProseMirror wrapper
				if (currentElement.classList.contains("ProseMirror")) {
					break;
				}

				currentElement = currentElement.parentElement;
			}

			// Show tooltip if we found a semantic tag
			if (foundTag) {
				setTooltip({
					visible: true,
					tagName: foundTag,
					x: e.clientX,
					y: e.clientY,
				});
			} else {
				setTooltip((prev) => ({ ...prev, visible: false }));
			}
		},
		[editor],
	);

	const handleMouseLeave = useCallback(() => {
		setTooltip((prev) => ({ ...prev, visible: false }));
	}, []);

	const setLink = useCallback(() => {
		if (!editor) return;

		if (linkUrl === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		} else {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: linkUrl })
				.run();
		}

		setLinkUrl("");
		setShowLinkInput(false);
	}, [editor, linkUrl]);

	const openLinkInput = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href || "";
		setLinkUrl(previousUrl);
		setShowLinkInput(true);
	}, [editor]);

	if (!editor) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				Loading editor...
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full ">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
				{/* Text formatting */}
				<div className="flex items-center gap-0.5">
					<Button
						variant={editor.isActive("bold") ? "secondary" : "ghost"}
						size="icon-sm"
						onClick={() => editor.chain().focus().toggleBold().run()}
						disabled={disabled}
						title="Bold (Ctrl+B)"
					>
						<Bold className="w-4 h-4" />
					</Button>
					<Button
						variant={editor.isActive("italic") ? "secondary" : "ghost"}
						size="icon-sm"
						onClick={() => editor.chain().focus().toggleItalic().run()}
						disabled={disabled}
						title="Italic (Ctrl+I)"
					>
						<Italic className="w-4 h-4" />
					</Button>
					<Button
						variant={editor.isActive("underline") ? "secondary" : "ghost"}
						size="icon-sm"
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						disabled={disabled}
						title="Underline (Ctrl+U)"
					>
						<UnderlineIcon className="w-4 h-4" />
					</Button>
				</div>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Headings */}
				<div className="flex items-center gap-0.5">
					<Button
						variant={
							editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
						}
						size="icon-sm"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						disabled={disabled}
						title="Heading 1"
					>
						<Heading1 className="w-4 h-4" />
					</Button>
					<Button
						variant={
							editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
						}
						size="icon-sm"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						disabled={disabled}
						title="Heading 2"
					>
						<Heading2 className="w-4 h-4" />
					</Button>
					<Button
						variant={
							editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
						}
						size="icon-sm"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						disabled={disabled}
						title="Heading 3"
					>
						<Heading3 className="w-4 h-4" />
					</Button>
					<Button
						variant={
							editor.isActive("heading", { level: 4 }) ? "secondary" : "ghost"
						}
						size="icon-sm"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 4 }).run()
						}
						disabled={disabled}
						title="Heading 4"
					>
						<Heading4 className="w-4 h-4" />
					</Button>
				</div>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Lists */}
				<div className="flex items-center gap-0.5">
					<Button
						variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
						size="icon-sm"
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						disabled={disabled}
						title="Bullet List"
					>
						<List className="w-4 h-4" />
					</Button>
					<Button
						variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
						size="icon-sm"
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						disabled={disabled}
						title="Ordered List"
					>
						<ListOrdered className="w-4 h-4" />
					</Button>
				</div>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Link */}
				<div className="flex items-center gap-0.5">
					{showLinkInput ? (
						<div className="flex items-center gap-1">
							<Input
								type="url"
								placeholder="Enter URL..."
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										setLink();
									}
									if (e.key === "Escape") {
										setShowLinkInput(false);
									}
								}}
								className="h-8 w-48 text-sm"
								autoFocus
							/>
							<Button variant="ghost" size="icon-sm" onClick={setLink}>
								<Check className="w-4 h-4" />
							</Button>
						</div>
					) : (
						<>
							<Button
								variant={editor.isActive("link") ? "secondary" : "ghost"}
								size="icon-sm"
								onClick={openLinkInput}
								disabled={disabled}
								title="Add Link"
							>
								<LinkIcon className="w-4 h-4" />
							</Button>
							{editor.isActive("link") && (
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() =>
										editor
											.chain()
											.focus()
											.extendMarkRange("link")
											.unsetLink()
											.run()
									}
									disabled={disabled}
									title="Remove Link"
								>
									<Unlink className="w-4 h-4" />
								</Button>
							)}
						</>
					)}
				</div>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Undo/Redo */}
				<div className="flex items-center gap-0.5">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => editor.chain().focus().undo().run()}
						disabled={disabled || !editor.can().undo()}
						title="Undo (Ctrl+Z)"
					>
						<Undo className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => editor.chain().focus().redo().run()}
						disabled={disabled || !editor.can().redo()}
						title="Redo (Ctrl+Y)"
					>
						<Redo className="w-4 h-4" />
					</Button>
				</div>

				{/* Save indicator */}
				<div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground min-w-[80px]">
					<div
						className={cn("flex items-center gap-2", !isSaving && "invisible")}
					>
						<Loader2 className="w-4 h-4 animate-spin" />
						<span>Saving...</span>
					</div>
				</div>
			</div>

			{/* Editor content */}
			<section
				ref={editorContainerRef}
				className="flex-1 overflow-auto px-4 pb-6 mb-16 relative min-h-0"
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				aria-label="Editor content area"
			>
				<EditorContent
					editor={editor}
					className={cn(
						"prose dark:prose-invert prose-sm max-w-none min-h-full",
						"[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:will-change-auto",
						"[&_.ProseMirror_p]:my-2 [&_.ProseMirror_p]:transition-colors [&_.ProseMirror_p:hover]:bg-secondary [&_.ProseMirror_p:hover]:rounded",
						"[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4 [&_.ProseMirror_h1]:transition-colors [&_.ProseMirror_h1:hover]:bg-secondary [&_.ProseMirror_h1:hover]:rounded",
						"[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3 [&_.ProseMirror_h2]:transition-colors [&_.ProseMirror_h2:hover]:bg-secondary [&_.ProseMirror_h2:hover]:rounded",
						"[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2 [&_.ProseMirror_h3]:transition-colors [&_.ProseMirror_h3:hover]:bg-secondary [&_.ProseMirror_h3:hover]:rounded",
						"[&_.ProseMirror_h4]:transition-colors [&_.ProseMirror_h4:hover]:bg-secondary [&_.ProseMirror_h4:hover]:rounded",
						"[&_.ProseMirror_h5]:transition-colors [&_.ProseMirror_h5:hover]:bg-secondary [&_.ProseMirror_h5:hover]:rounded",
						"[&_.ProseMirror_h6]:transition-colors [&_.ProseMirror_h6:hover]:bg-secondary [&_.ProseMirror_h6:hover]:rounded",
						"[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:transition-colors [&_.ProseMirror_ul:hover]:bg-secondary [&_.ProseMirror_ul:hover]:rounded",
						"[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:transition-colors [&_.ProseMirror_ol:hover]:bg-secondary [&_.ProseMirror_ol:hover]:rounded",
						"[&_.ProseMirror_li]:my-1 [&_.ProseMirror_li]:transition-colors [&_.ProseMirror_li:hover]:bg-secondary [&_.ProseMirror_li:hover]:rounded",
						"[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:transition-colors [&_.ProseMirror_a:hover]:bg-secondary [&_.ProseMirror_a:hover]:rounded",
						"[&_.ProseMirror_strong]:transition-colors [&_.ProseMirror_strong]:hover:bg-secondary [&_.ProseMirror_strong]:hover:rounded",
						"[&_.ProseMirror_b]:transition-colors [&_.ProseMirror_b]:hover:bg-secondary [&_.ProseMirror_b]:hover:rounded",
						"[&_.ProseMirror_em]:transition-colors [&_.ProseMirror_em]:hover:bg-secondary [&_.ProseMirror_em]:hover:rounded",
						"[&_.ProseMirror_i]:transition-colors [&_.ProseMirror_i]:hover:bg-secondary [&_.ProseMirror_i]:hover:rounded",
						"[&_.ProseMirror_u]:transition-colors [&_.ProseMirror_u]:hover:bg-secondary [&_.ProseMirror_u]:hover:rounded",
						"[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:transition-colors [&_.ProseMirror_blockquote:hover]:bg-secondary [&_.ProseMirror_blockquote:hover]:rounded",
						"[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:transition-colors [&_.ProseMirror_code:hover]:bg-secondary",
						"[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:transition-colors [&_.ProseMirror_pre:hover]:bg-secondary",
					)}
				/>
				{/* Tooltip */}
				{tooltip.visible && (
					<div
						className="fixed z-50 px-2 py-1 text-xs font-mono bg-popover text-popover-foreground border rounded shadow-lg pointer-events-none"
						style={{
							left: `${tooltip.x + 10}px`,
							top: `${tooltip.y - 30}px`,
						}}
					>
						&lt;{tooltip.tagName}&gt;
					</div>
				)}
			</section>
		</div>
	);
}
