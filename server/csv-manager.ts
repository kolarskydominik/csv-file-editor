import Papa from 'papaparse'

export type CSVRow = {
  [key: string]: string
}

class CSVManager {
  private data: CSVRow[] = []
  private columns: string[] = []
  private fileName: string = ''
  private dirtyRows: Set<number> = new Set()

  // Load from CSV content string (for drag-and-drop upload)
  loadFromContent(content: string, fileName: string): void {
    this.fileName = fileName

    const result = Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
    })

    this.data = result.data
    this.columns = result.meta.fields || []
    this.dirtyRows.clear()
  }

  getRow(index: number): CSVRow | null {
    return this.data[index] || null
  }

  getRows(start: number, count: number): Array<{ index: number; data: CSVRow }> {
    return this.data.slice(start, start + count).map((row, i) => ({
      index: start + i,
      data: row,
    }))
  }

  getAllData(): CSVRow[] {
    return this.data
  }

  updateCell(rowIndex: number, column: string, value: string): boolean {
    if (this.data[rowIndex] && column in this.data[rowIndex]) {
      this.data[rowIndex][column] = value
      this.dirtyRows.add(rowIndex)
      return true
    }
    return false
  }

  // Export as CSV string (for download)
  exportCSV(): string {
    return Papa.unparse(this.data, { columns: this.columns })
  }

  get totalRows(): number {
    return this.data.length
  }

  get isDirty(): boolean {
    return this.dirtyRows.size > 0
  }

  get dirtyCount(): number {
    return this.dirtyRows.size
  }

  get columnNames(): string[] {
    return this.columns
  }

  get loadedFileName(): string {
    return this.fileName
  }
}

export const csvManager = new CSVManager()
