import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDownloadUrl } from '@/lib/api'

type DownloadButtonProps = {
  isDirty: boolean
  dirtyCount: number
  fileName: string
}

export function DownloadButton({ isDirty, dirtyCount, fileName }: DownloadButtonProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = getDownloadUrl()
    link.download = fileName.replace('.csv', '-modified.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={!isDirty}
      variant={isDirty ? 'default' : 'secondary'}
    >
      <Download className="w-4 h-4" />
      {isDirty ? `Download (${dirtyCount} changed)` : 'No changes'}
    </Button>
  )
}
