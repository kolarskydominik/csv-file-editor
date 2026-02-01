import { getDownloadUrl } from '@/lib/api'

type DownloadButtonProps = {
  isDirty: boolean
  dirtyCount: number
  fileName: string
}

export function DownloadButton({ isDirty, dirtyCount, fileName }: DownloadButtonProps) {
  const handleDownload = () => {
    // Trigger download via link
    const link = document.createElement('a')
    link.href = getDownloadUrl()
    link.download = fileName.replace('.csv', '-modified.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!isDirty}
      className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
        isDirty
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {isDirty ? (
        <>Download ({dirtyCount} changed)</>
      ) : (
        'No changes'
      )}
    </button>
  )
}
