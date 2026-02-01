import { useState, useCallback, useEffect } from 'react'
import { RecordList } from '@/components/record-list'
import { HtmlPreview } from '@/components/html-preview'
import { LinkEditorModal } from '@/components/link-editor-modal'
import { Navigation } from '@/components/navigation'
import { DownloadButton } from '@/components/download-button'
import { FileDropZone } from '@/components/file-drop-zone'
import { ColumnSelector } from '@/components/column-selector'
import { LinksList } from '@/components/links-list'
import { useCSVData } from '@/hooks/use-csv-data'
import { useLinkNavigation } from '@/hooks/use-link-navigation'
import { replaceLinkHref, parseLinks } from '@/lib/link-parser'

type SelectedLink = {
  href: string
  index: number
}

export default function App() {
  const {
    uploadResult,
    metadata,
    rows,
    loading,
    error,
    uploadFile,
    selectColumns,
    reset,
    loadRows,
    updateCell,
    clearError,
  } = useCSVData()

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [selectedLink, setSelectedLink] = useState<SelectedLink | null>(null)
  const [column, setColumn] = useState<string>('')

  const {
    currentLinkIndex,
    totalLinkRows,
    goToNextLink,
    goToPrevLink,
    hasNext,
    hasPrev,
    refreshLinkRows,
  } = useLinkNavigation(selectedRowIndex)

  // Set initial column when metadata loads
  useEffect(() => {
    if (metadata?.linkColumns?.length && !column) {
      setColumn(metadata.linkColumns[0])
    }
  }, [metadata, column])

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

  const handleStartOver = useCallback(() => {
    setSelectedRowIndex(null)
    setSelectedLink(null)
    setColumn('')
    reset()
  }, [reset])

  // Keyboard navigation - arrow keys for prev/next record
  useEffect(() => {
    if (!metadata || selectedLink !== null) return // Don't navigate when modal is open

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [metadata, selectedLink, handlePrev, handleNext])

  // Get available link columns from metadata
  const linkColumns = metadata?.linkColumns || []

  // Count links in current content
  const currentHtml = selectedRow?.[column] || ''
  const linksInCurrentContent = parseLinks(currentHtml).length

  // Step 1: No file uploaded - show drop zone
  if (!uploadResult) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg border">
            <FileDropZone onFileLoaded={uploadFile} loading={loading} />
            {error && (
              <div className="px-8 pb-8">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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

  // Step 2: File uploaded, but columns not selected
  if (!metadata) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg border">
            <ColumnSelector
              columns={uploadResult.columns}
              fileName={uploadResult.fileName}
              totalRows={uploadResult.totalRows}
              onConfirm={selectColumns}
              onCancel={handleStartOver}
              loading={loading}
            />
            {error && (
              <div className="px-8 pb-8">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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

  // Step 3: Ready to edit
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">CSV Link Editor</h1>
          <span className="text-sm text-gray-500">
            {metadata.totalRows.toLocaleString()} rows &middot; {metadata.fileName}
          </span>
          <button
            onClick={handleStartOver}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load different file
          </button>
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
          <DownloadButton
            isDirty={metadata.isDirty}
            dirtyCount={metadata.dirtyCount}
            fileName={metadata.fileName}
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
        <div className="w-72 border-r bg-white overflow-hidden flex flex-col shrink-0">
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

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
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
                <span className="text-xs text-gray-400">
                  Use arrow keys to navigate
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
                  or use arrow keys / navigation buttons
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Links List */}
        <div className="w-80 border-l bg-white overflow-hidden flex flex-col shrink-0">
          <div className="p-3 border-b bg-gray-50 text-sm font-medium text-gray-600">
            Links ({linksInCurrentContent})
          </div>
          <div className="flex-1 overflow-auto">
            {selectedRow ? (
              <LinksList
                html={currentHtml}
                selectedLinkIndex={selectedLink?.index}
                onLinkClick={handleLinkClick}
              />
            ) : (
              <div className="p-4 text-gray-400 text-sm italic">
                Select a record to see links
              </div>
            )}
          </div>
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
