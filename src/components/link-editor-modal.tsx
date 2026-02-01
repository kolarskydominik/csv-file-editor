import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LinkEditorModalProps = {
  isOpen: boolean
  href: string
  onSave: (newHref: string) => void
  onClose: () => void
}

export function LinkEditorModal({ isOpen, href, onSave, onClose }: LinkEditorModalProps) {
  const [value, setValue] = useState(href)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(href)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, href])

  const handleSave = () => {
    onSave(value)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const isModified = value !== href

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Link URL</DialogTitle>
          <DialogDescription>
            Modify the URL for this link. Press Enter to save or Escape to cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="url-input" className="text-sm font-medium">
            URL
          </label>
          <Input
            id="url-input"
            ref={inputRef}
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="font-mono"
            placeholder="https://..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isModified}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
