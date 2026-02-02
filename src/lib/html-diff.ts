/**
 * HTML-aware diff utility that highlights changed elements
 */

/**
 * Compare two HTML strings and return a diffed version with highlighted changes
 */
export function diffHtml(oldHtml: string, newHtml: string): string {
	if (oldHtml === newHtml) {
		return newHtml;
	}

	const parser = new DOMParser();
	const oldDoc = parser.parseFromString(oldHtml || "<div></div>", "text/html");
	const newDoc = parser.parseFromString(newHtml || "<div></div>", "text/html");

	const oldBody = oldDoc.body;
	const newBody = newDoc.body;

	// Compare and mark changes
	compareAndMark(oldBody, newBody);

	return newBody.innerHTML;
}

/**
 * Recursively compare two DOM nodes and mark differences
 */
function compareAndMark(oldNode: Node, newNode: Node): void {
	if (!oldNode || !newNode) {
		if (newNode) markAsAdded(newNode);
		return;
	}

	// If nodes are different types, mark as changed
	if (oldNode.nodeType !== newNode.nodeType) {
		markAsChanged(newNode);
		return;
	}

	// Handle text nodes
	if (
		oldNode.nodeType === Node.TEXT_NODE &&
		newNode.nodeType === Node.TEXT_NODE
	) {
		const oldText = (oldNode.textContent || "").trim();
		const newText = (newNode.textContent || "").trim();
		if (oldText !== newText && newText) {
			markAsChanged(newNode);
		}
		return;
	}

	// Handle element nodes
	if (
		oldNode.nodeType === Node.ELEMENT_NODE &&
		newNode.nodeType === Node.ELEMENT_NODE
	) {
		const oldEl = oldNode as HTMLElement;
		const newEl = newNode as HTMLElement;

		// Compare tag names
		if (oldEl.tagName !== newEl.tagName) {
			markAsChanged(newEl);
			return;
		}

		// Compare attributes (especially href for links)
		const oldAttrs = getAttributes(oldEl);
		const newAttrs = getAttributes(newEl);
		const attrsChanged = JSON.stringify(oldAttrs) !== JSON.stringify(newAttrs);

		// Compare children
		const oldChildren = Array.from(oldEl.childNodes).filter(
			(n) => n.nodeType !== Node.TEXT_NODE || (n.textContent || "").trim(),
		);
		const newChildren = Array.from(newEl.childNodes).filter(
			(n) => n.nodeType !== Node.TEXT_NODE || (n.textContent || "").trim(),
		);

		// If attributes changed, mark the element
		if (attrsChanged) {
			markAsChanged(newEl);
		}

		// Compare children recursively
		const maxLength = Math.max(oldChildren.length, newChildren.length);
		for (let i = 0; i < maxLength; i++) {
			if (i >= oldChildren.length) {
				// New child added
				if (i < newChildren.length) {
					markAsAdded(newChildren[i]);
				}
			} else if (i >= newChildren.length) {
			} else {
				compareAndMark(oldChildren[i], newChildren[i]);
			}
		}
	}
}

/**
 * Get all attributes as an object
 */
function getAttributes(el: HTMLElement): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (let i = 0; i < el.attributes.length; i++) {
		const attr = el.attributes[i];
		attrs[attr.name] = attr.value;
	}
	return attrs;
}

/**
 * Mark a node as changed (modified)
 */
function markAsChanged(node: Node): void {
	if (node.nodeType === Node.ELEMENT_NODE) {
		const el = node as HTMLElement;
		el.classList.add("html-diff-changed");
		el.setAttribute("data-diff", "changed");
	} else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
		// Wrap text nodes in a span
		const span = document.createElement("span");
		span.classList.add("html-diff-changed");
		span.setAttribute("data-diff", "changed");
		span.textContent = node.textContent;
		node.parentElement.replaceChild(span, node);
	}
}

/**
 * Mark a node as added
 */
function markAsAdded(node: Node): void {
	if (node.nodeType === Node.ELEMENT_NODE) {
		const el = node as HTMLElement;
		el.classList.add("html-diff-added");
		el.setAttribute("data-diff", "added");
	} else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
		const span = document.createElement("span");
		span.classList.add("html-diff-added");
		span.setAttribute("data-diff", "added");
		span.textContent = node.textContent;
		node.parentElement.replaceChild(span, node);
	}
}

/**
 * Create a side-by-side diff view with old and new HTML
 */
export function createDiffView(
	oldHtml: string,
	newHtml: string,
): {
	oldHtmlDiffed: string;
	newHtmlDiffed: string;
} {
	if (!oldHtml && !newHtml) {
		return { oldHtmlDiffed: "", newHtmlDiffed: "" };
	}

	try {
		const parser = new DOMParser();

		// Parse both HTML strings - wrap in div to handle fragments
		const oldWrapper = oldHtml.trim() ? `<div>${oldHtml}</div>` : "<div></div>";
		const newWrapper = newHtml.trim() ? `<div>${newHtml}</div>` : "<div></div>";

		const oldDoc = parser.parseFromString(oldWrapper, "text/html");
		const newDoc = parser.parseFromString(newWrapper, "text/html");

		const oldRoot = oldDoc.body.firstElementChild || oldDoc.body;
		const newRoot = newDoc.body.firstElementChild || newDoc.body;

		// Mark removed elements in old HTML
		markRemoved(oldRoot, newRoot);

		// Mark added/changed elements in new HTML
		compareAndMark(oldRoot, newRoot);

		// Extract innerHTML, handling the wrapper div
		const oldResult =
			oldRoot === oldDoc.body
				? oldRoot.innerHTML
				: (oldRoot as HTMLElement).innerHTML;
		const newResult =
			newRoot === newDoc.body
				? newRoot.innerHTML
				: (newRoot as HTMLElement).innerHTML;

		return {
			oldHtmlDiffed: oldResult,
			newHtmlDiffed: newResult,
		};
	} catch (error) {
		console.error("Error in createDiffView:", error);
		// Fallback to original HTML if parsing fails
		return {
			oldHtmlDiffed: oldHtml,
			newHtmlDiffed: newHtml,
		};
	}
}

/**
 * Mark elements that were removed (exist in old but not in new)
 */
function markRemoved(oldNode: Node, newNode: Node): void {
	if (
		oldNode.nodeType === Node.ELEMENT_NODE &&
		newNode.nodeType === Node.ELEMENT_NODE
	) {
		const oldEl = oldNode as HTMLElement;
		const newEl = newNode as HTMLElement;

		if (oldEl.tagName === newEl.tagName) {
			const oldChildren = Array.from(oldEl.childNodes);
			const newChildren = Array.from(newEl.childNodes);

			// Mark removed children
			for (let i = newChildren.length; i < oldChildren.length; i++) {
				markAsRemoved(oldChildren[i]);
			}

			// Recursively check children
			const minLength = Math.min(oldChildren.length, newChildren.length);
			for (let i = 0; i < minLength; i++) {
				markRemoved(oldChildren[i], newChildren[i]);
			}
		} else {
			markAsRemoved(oldEl);
		}
	} else if (oldNode.nodeType === Node.TEXT_NODE) {
		const oldText = oldNode.textContent || "";
		const newText = newNode.textContent || "";
		if (oldText.trim() !== newText.trim() && oldText.trim()) {
			markAsRemoved(oldNode);
		}
	}
}

/**
 * Mark a node as removed
 */
function markAsRemoved(node: Node): void {
	if (node.nodeType === Node.ELEMENT_NODE) {
		const el = node as HTMLElement;
		el.classList.add("html-diff-removed");
		el.setAttribute("data-diff", "removed");
	} else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
		const span = document.createElement("span");
		span.classList.add("html-diff-removed");
		span.setAttribute("data-diff", "removed");
		span.textContent = node.textContent;
		node.parentElement.replaceChild(span, node);
	}
}
