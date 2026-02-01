import { useMemo } from 'react'
import { parseLinks } from '@/lib/link-parser'

type LinksListProps = {
  html: string
  selectedLinkIndex?: number
  onLinkClick: (href: string, index: number) => void
}

export function LinksList({ html, selectedLinkIndex, onLinkClick }: LinksListProps) {
  const links = useMemo(() => parseLinks(html), [html])

  if (links.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-sm italic">
        No links in this cell
      </div>
    )
  }

  // Extract link text from the HTML for display
  const getTextAfterLink = (startIndex: number, endIndex: number, html: string) => {
    const afterTag = html.slice(endIndex)
    const closeTagIndex = afterTag.indexOf('</a>')
    if (closeTagIndex === -1) return ''
    return afterTag.slice(0, closeTagIndex).replace(/<[^>]*>/g, '').trim()
  }

  return (
    <div className="divide-y divide-gray-100">
      {links.map((link, index) => {
        const linkText = getTextAfterLink(link.startIndex, link.endIndex, html)
        const isSelected = index === selectedLinkIndex

        return (
          <button
            key={index}
            onClick={() => onLinkClick(link.href, index)}
            className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 mt-0.5 shrink-0">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {linkText && (
                  <div className="text-sm font-medium text-gray-800 truncate mb-1" title={linkText}>
                    {linkText}
                  </div>
                )}
                <div
                  className="text-xs text-blue-600 truncate font-mono"
                  title={link.href}
                >
                  {link.href}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
