import { useState, useCallback } from 'react'
import { RecordList } from '@/components/record-list'
import { HtmlPreview } from '@/components/html-preview'
import { LinkEditorModal } from '@/components/link-editor-modal'
import { Navigation } from '@/components/navigation'
import { SaveButton } from '@/components/save-button'
import { FileLoader } from '@/components/file-loader'
import { useCSVData } from '@/hooks/use-csv-data'
import { useLinkNavigation } from '@/hooks/use-link-navigation'
import { replaceLinkHref, parseLinks } from '@/lib/link-parser'

type SelectedLink = {
  href: string
  index: number
}

export default function App() {
  const {
    metadata,
    rows,
    loading,
    error,
    loadFile,
    loadRows,
    updateCell,
    save,
    clearError,
  } = useCSVData()

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [selectedLink, setSelectedLink] = useState<SelectedLink | null>(null)
  const [column, setColumn] = useState<string>('Content')

  const {
    currentLinkIndex,
    totalLinkRows,
    goToNextLink,
    goToPrevLink,
    hasNext,
    hasPrev,
    refreshLinkRows,
  } = useLinkNavigation(selectedRowIndex)

  const selectedRow = selectedRowIndex !== null ? rows.get(selectedRowIndex) : null

  const handleLinkClick = useCallback((href: string, linkIndex: number) => {
    setSelectedLink({ href, index: linkIndex })
  }, [])

  const handleLinkSave = useCallback(
    async (newHref: string) => {
      if (selectedRowIndex === null || !selectedLink || !selectedRow) return

      const html = selectedRow[column] || ''
      const updatedHtml = replaceLinkHref(html, selectedLink.index, newHref)

      const success = await updateCell(selectedRowIndex, column, updatedHtml)
      if (success) {
        setSelectedLink({ ...selectedLink, href: newHref })
        refreshLinkRows()
      }
    },
    [selectedRowIndex, selectedLink, selectedRow, column, updateCell, refreshLinkRows]
  )

  const handlePrev = useCallback(async () => {
    const prevRow = await goToPrevLink()
    if (prevRow !== null) {
      setSelectedRowIndex(prevRow)
      setSelectedLink(null)
    }
  }, [goToPrevLink])

  const handleNext = useCallback(async () => {
    const nextRow = await goToNextLink()
    if (nextRow !== null) {
      setSelectedRowIndex(nextRow)
      setSelectedLink(null)
    }
  }, [goToNextLink])

  const handleColumnChange = useCallback((newColumn: string) => {
    setColumn(newColumn)
    setSelectedLink(null)
  }, [])

  // Get available link columns from metadata
  const linkColumns = metadata?.linkColumns || ['Content', 'Content 2']

  // Count links in current content
  const currentHtml = selectedRow?.[column] || ''
  const linksInCurrentContent = parseLinks(currentHtml).length

  // If no file loaded, show file loader
  if (!metadata) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="border-b bg-white p-4">
          <h1 className="text-xl font-bold text-gray-800">CSV Link Editor</h1>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg border">
            <FileLoader onLoad={loadFile} loading={loading} />
            {error && (
              <div className="px-6 pb-6">
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                  <button
                    onClick={clearError}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">CSV Link Editor</h1>
          <span className="text-sm text-gray-500">
            {metadata.totalRows.toLocaleString()} rows &middot; {metadata.filePath}
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <Navigation
            currentRow={selectedRowIndex}
            currentLinkIndex={currentLinkIndex}
            totalLinkRows={totalLinkRows}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          <SaveButton
            onSave={save}
            isDirty={metadata.isDirty}
            dirtyCount={metadata.dirtyCount}
          />
        </div>
      </header>

      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Record List */}
        <div className="w-80 border-r bg-white overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50 text-sm font-medium text-gray-600">
            Records ({metadata.totalRows.toLocaleString()})
          </div>
          <div className="flex-1 overflow-hidden">
            <RecordList
              totalRows={metadata.totalRows}
              selectedIndex={selectedRowIndex}
              onSelect={(idx) => {
                setSelectedRowIndex(idx)
                setSelectedLink(null)
              }}
              loadRows={loadRows}
              rows={rows}
              titleColumn={metadata.columns.includes('Title') ? 'Title' : metadata.columns[0]}
            />
          </div>
        </div>

        {/* Right: Preview + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedRow ? (
            <>
              <div className="p-3 border-b bg-gray-50 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-600">Column:</label>
                <select
                  value={column}
                  onChange={(e) => handleColumnChange(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {linkColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  {linksInCurrentContent} link{linksInCurrentContent !== 1 ? 's' : ''} in this cell
                </span>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <HtmlPreview
                  html={currentHtml}
                  onLinkClick={handleLinkClick}
                  selectedLinkIndex={selectedLink?.index}
                />
              </div>

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Select a record to view</p>
                <p className="text-sm">
                  or use the navigation buttons to jump to rows with links
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Link Editor Modal */}
      <LinkEditorModal
        isOpen={selectedLink !== null}
        href={selectedLink?.href || ''}
        onSave={handleLinkSave}
        onClose={() => setSelectedLink(null)}
      />
    </div>
  )
}
