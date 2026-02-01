import DOMPurify from 'dompurify'
import { useEffect, useRef, useMemo } from 'react'

type HtmlPreviewProps = {
  html: string
  onLinkClick: (href: string, index: number) => void
  selectedLinkIndex?: number
}

export function HtmlPreview({ html, onLinkClick, selectedLinkIndex }: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Sanitize HTML and convert href to data-href to prevent navigation
  const sanitizedHtml = useMemo(() => {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a',
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'strong',
        'em',
        'b',
        'i',
        'br',
        'img',
        'div',
        'span',
        'blockquote',
        'pre',
        'code',
      ],
      ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id'],
    })

    // Replace href with data-href to completely prevent navigation
    return clean.replace(/<a\s+([^>]*)href=["']([^"']*)["']([^>]*)>/gi, (_match, before, href, after) => {
      return `<a ${before}data-href="${href}"${after}>`
    })
  }, [html])

  useEffect(() => {
    if (!containerRef.current) return

    const links = containerRef.current.querySelectorAll('a')

    links.forEach((link, index) => {
      // Add visual indicator for selected link
      if (index === selectedLinkIndex) {
        link.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'bg-blue-50')
      } else {
        link.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'bg-blue-50')
      }
    })
  }, [sanitizedHtml, selectedLinkIndex])

  // Use event delegation on container - simpler and more reliable
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const link = target.closest('a')
    if (!link) return

    e.preventDefault()
    e.stopPropagation()

    const href = link.getAttribute('data-href') || ''
    const links = containerRef.current?.querySelectorAll('a')
    const index = links ? Array.from(links).indexOf(link) : -1

    if (index >= 0) {
      onLinkClick(href, index)
    }
  }

  if (!html) {
    return (
      <div className="text-gray-400 italic p-4">
        No content in this column
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a]:inline-block [&_a]:px-1 [&_a]:rounded hover:[&_a]:bg-blue-100"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
