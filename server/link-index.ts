import type { CSVRow } from './csv-manager'

const LINK_REGEX = /<a\s+[^>]*href=/gi

export function buildLinkIndex(
  data: CSVRow[],
  columns: string[] = ['Content', 'Content 2']
): number[] {
  const rowsWithLinks: number[] = []

  for (let i = 0; i < data.length; i++) {
    for (const col of columns) {
      const value = data[i][col]
      if (value && LINK_REGEX.test(value)) {
        rowsWithLinks.push(i)
        LINK_REGEX.lastIndex = 0 // Reset regex state
        break
      }
    }
  }

  return rowsWithLinks
}

export function findNextLinkRow(linkIndex: number[], fromRow: number): number | null {
  const next = linkIndex.find((i) => i > fromRow)
  return next ?? null
}

export function findPrevLinkRow(linkIndex: number[], fromRow: number): number | null {
  const prev = [...linkIndex].reverse().find((i) => i < fromRow)
  return prev ?? null
}
