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
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastContentRef = useRef(content);

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
			lastContentRef.current = content;
			editor.commands.setContent(content);
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
				<div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
					{isSaving && (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Saving...</span>
						</>
					)}
				</div>
			</div>

			{/* Editor content */}
			<div className="flex-1 overflow-auto px-4 pb-6 mb-16 ">
				<EditorContent
					editor={editor}
					className={cn(
						"prose prose-sm max-w-none min-h-full",
						"[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full",
						"[&_.ProseMirror_p]:my-2",
						"[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4",
						"[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3",
						"[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2",
						"[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2",
						"[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2",
						"[&_.ProseMirror_li]:my-1",
						"[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline",
						"[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic",
						"[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded",
						"[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded",
					)}
				/>
			</div>
		</div>
	);
}
