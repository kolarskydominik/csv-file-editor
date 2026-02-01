import express from 'express'
import cors from 'cors'
import { csvManager } from './csv-manager'
import { buildLinkIndex, findNextLinkRow, findPrevLinkRow } from './link-index'

const app = express()
app.use(cors())
app.use(express.json())

let linkIndex: number[] = []
let linkColumns: string[] = []

// GET /api/load - Load a CSV file
app.post('/api/load', async (req, res) => {
  const { filePath, columns } = req.body as { filePath: string; columns?: string[] }

  if (!filePath) {
    res.status(400).json({ error: 'filePath is required' })
    return
  }

  try {
    await csvManager.load(filePath)
    linkColumns = columns || ['Content', 'Content 2']
    linkIndex = buildLinkIndex(csvManager.getAllData(), linkColumns)

    res.json({
      success: true,
      totalRows: csvManager.totalRows,
      columns: csvManager.columnNames,
      totalLinksRows: linkIndex.length,
      linkColumns,
    })
  } catch (error) {
    res.status(500).json({ error: `Failed to load file: ${error}` })
  }
})

// GET /api/metadata
app.get('/api/metadata', (_req, res) => {
  res.json({
    totalRows: csvManager.totalRows,
    columns: csvManager.columnNames,
    totalLinksRows: linkIndex.length,
    isDirty: csvManager.isDirty,
    dirtyCount: csvManager.dirtyCount,
    filePath: csvManager.loadedFilePath,
    linkColumns,
  })
})

// GET /api/rows?start=0&count=50
app.get('/api/rows', (req, res) => {
  const start = parseInt(req.query.start as string) || 0
  const count = parseInt(req.query.count as string) || 50
  res.json(csvManager.getRows(start, count))
})

// GET /api/row/:index
app.get('/api/row/:index', (req, res) => {
  const index = parseInt(req.params.index)
  const row = csvManager.getRow(index)
  if (row) {
    res.json({ index, data: row })
  } else {
    res.status(404).json({ error: 'Row not found' })
  }
})

// PATCH /api/row/:index
app.patch('/api/row/:index', (req, res) => {
  const index = parseInt(req.params.index)
  const { column, value } = req.body as { column: string; value: string }

  if (!column || value === undefined) {
    res.status(400).json({ error: 'column and value are required' })
    return
  }

  const success = csvManager.updateCell(index, column, value)
  if (success) {
    // Rebuild link index if we modified a link column
    if (linkColumns.includes(column)) {
      linkIndex = buildLinkIndex(csvManager.getAllData(), linkColumns)
    }
    res.json({ success: true, isDirty: csvManager.isDirty, dirtyCount: csvManager.dirtyCount })
  } else {
    res.status(404).json({ error: 'Row or column not found' })
  }
})

// POST /api/save
app.post('/api/save', async (_req, res) => {
  try {
    await csvManager.save()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: `Failed to save: ${error}` })
  }
})

// GET /api/links/next?from=0
app.get('/api/links/next', (req, res) => {
  const from = parseInt(req.query.from as string) || 0
  const rowIndex = findNextLinkRow(linkIndex, from)
  res.json({ rowIndex })
})

// GET /api/links/prev?from=100
app.get('/api/links/prev', (req, res) => {
  const from = parseInt(req.query.from as string) || 0
  const rowIndex = findPrevLinkRow(linkIndex, from)
  res.json({ rowIndex })
})

// GET /api/links/all - Get all row indices with links
app.get('/api/links/all', (_req, res) => {
  res.json({ rowIndices: linkIndex })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`CSV Editor API running on http://localhost:${PORT}`)
  console.log('Use POST /api/load with { filePath: "..." } to load a CSV file')
})
