import { useMemo } from 'react'
import { parseLinks } from '@/lib/link-parser'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type LinksListProps = {
  html: string
  selectedLinkIndex?: number
  onLinkClick: (href: string, index: number) => void
}

export function LinksList({ html, selectedLinkIndex, onLinkClick }: LinksListProps) {
  const links = useMemo(() => parseLinks(html), [html])

  if (links.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-sm italic">
        No links in this cell
      </div>
    )
  }

  const getTextAfterLink = (startIndex: number, endIndex: number, html: string) => {
    const afterTag = html.slice(endIndex)
    const closeTagIndex = afterTag.indexOf('</a>')
    if (closeTagIndex === -1) return ''
    return afterTag.slice(0, closeTagIndex).replace(/<[^>]*>/g, '').trim()
  }

  return (
    <div className="divide-y divide-border">
      {links.map((link, index) => {
        const linkText = getTextAfterLink(link.startIndex, link.endIndex, html)
        const isSelected = index === selectedLinkIndex

        return (
          <button
            key={index}
            onClick={() => onLinkClick(link.href, index)}
            className={cn(
              'w-full text-left p-3 hover:bg-accent transition-colors',
              isSelected && 'bg-primary/10 border-l-4 border-l-primary'
            )}
          >
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 mt-0.5">
                {index + 1}
              </Badge>
              <div className="min-w-0 flex-1">
                {linkText && (
                  <div className="text-sm font-medium text-foreground truncate mb-1" title={linkText}>
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
        )
      })}
    </div>
  )
}
