export type ParsedLink = {
  fullMatch: string
  href: string
  startIndex: number
  endIndex: number
}

export function parseLinks(html: string): ParsedLink[] {
  const regex = /<a\s+([^>]*?)href=(["'])([^"']*)\2([^>]*)>/gi
  const links: ParsedLink[] = []
  let match

  while ((match = regex.exec(html)) !== null) {
    links.push({
      fullMatch: match[0],
      href: match[3],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return links
}

export function replaceLinkHref(html: string, linkIndex: number, newHref: string): string {
  const links = parseLinks(html)
  if (linkIndex < 0 || linkIndex >= links.length) return html

  const link = links[linkIndex]

  // Replace only the href value, preserving other attributes
  const newTag = link.fullMatch.replace(/href=(["'])[^"']*\1/, `href="${newHref}"`)

  return html.slice(0, link.startIndex) + newTag + html.slice(link.endIndex)
}

export function countLinks(html: string): number {
  return parseLinks(html).length
}
