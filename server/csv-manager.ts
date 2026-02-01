import Papa from 'papaparse'
import fs from 'fs/promises'

export type CSVRow = {
  [key: string]: string
}

class CSVManager {
  private data: CSVRow[] = []
  private columns: string[] = []
  private filePath: string = ''
  private dirtyRows: Set<number> = new Set()

  async load(filePath: string): Promise<void> {
    this.filePath = filePath
    const content = await fs.readFile(filePath, 'utf-8')

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

  async save(): Promise<void> {
    const csv = Papa.unparse(this.data, { columns: this.columns })
    const tempPath = this.filePath + '.tmp'
    const backupPath = this.filePath + '.bak'

    // Write to temp file
    await fs.writeFile(tempPath, csv, 'utf-8')

    // Create backup of original
    try {
      await fs.copyFile(this.filePath, backupPath)
    } catch {
      // Original might not exist on first save
    }

    // Atomic rename
    await fs.rename(tempPath, this.filePath)

    // Clear dirty state
    this.dirtyRows.clear()
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

  get loadedFilePath(): string {
    return this.filePath
  }
}

export const csvManager = new CSVManager()
