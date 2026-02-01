import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef } from "react";

type HtmlPreviewProps = {
	html: string;
	onLinkClick: (href: string, index: number) => void;
	selectedLinkIndex?: number;
};

export function HtmlPreview({
	html,
	onLinkClick,
	selectedLinkIndex,
}: HtmlPreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Sanitize HTML and convert href to data-href to prevent navigation
	const sanitizedHtml = useMemo(() => {
		const clean = DOMPurify.sanitize(html, {
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

		// Replace href with data-href to completely prevent navigation
		return clean.replace(
			/<a\s+([^>]*)href=["']([^"']*)["']([^>]*)>/gi,
			(_match, before, href, after) => {
				return `<a ${before}data-href="${href}"${after}>`;
			},
		);
	}, [html]);

	useEffect(() => {
		if (!containerRef.current) return;

		const links = containerRef.current.querySelectorAll("a");

		links.forEach((link, index) => {
			// Add visual indicator for selected link
			if (index === selectedLinkIndex) {
				link.classList.add(
					"ring-2",
					"ring-blue-500",
					"ring-offset-2",
					"bg-blue-50",
				);
			} else {
				link.classList.remove(
					"ring-2",
					"ring-blue-500",
					"ring-offset-2",
					"bg-blue-50",
				);
			}
		});
	}, [selectedLinkIndex]);

	// Use event delegation on container - simpler and more reliable
	const handleClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const link = target.closest("a");
		if (!link) return;

		const href = link.getAttribute("data-href") || "";
		const links = containerRef.current?.querySelectorAll("a");
		const index = links ? Array.from(links).indexOf(link) : -1;

		// Ctrl/Cmd+Click opens in new tab
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			if (href) {
				window.open(href, "_blank", "noopener,noreferrer");
			}
			return;
		}

		// Regular click opens editor modal
		e.preventDefault();
		e.stopPropagation();

		if (index >= 0) {
			onLinkClick(href, index);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			const target = e.target as HTMLElement;
			const link = target.closest("a");
			if (link) {
				e.preventDefault();
				const href = link.getAttribute("data-href") || "";
				const links = containerRef.current?.querySelectorAll("a");
				const index = links ? Array.from(links).indexOf(link) : -1;
				if (index >= 0) {
					onLinkClick(href, index);
				}
			}
		}
	};

	if (!html) {
		return (
			<div className="text-gray-400 italic p-4">No content in this column</div>
		);
	}

	return (
		<section
			ref={containerRef}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			aria-label="HTML preview"
			className="prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a]:inline-block [&_a]:px-1 [&_a]:rounded hover:[&_a]:bg-blue-100"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML content needs to be rendered dynamically
			dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
		/>
	);
}
