import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type ColumnSelectorProps = {
  columns: string[]
  fileName: string
  totalRows: number
  onConfirm: (selectedColumns: string[]) => void
  onCancel: () => void
  loading: boolean
}

export function ColumnSelector({
  columns,
  fileName,
  totalRows,
  onConfirm,
  onCancel,
  loading,
}: ColumnSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleColumn = (col: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(col)) {
        next.delete(col)
      } else {
        next.add(col)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size > 0) {
      onConfirm(Array.from(selected))
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Columns with Links</CardTitle>
        <CardDescription>
          <span className="font-medium">{fileName}</span> &middot; {totalRows.toLocaleString()} rows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Choose which columns contain HTML with links you want to edit:
        </p>

        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
          {columns.map((col) => (
            <div
              key={col}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${selected.has(col) ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}
              `}
              onClick={() => toggleColumn(col)}
            >
              <Checkbox
                id={`col-${col}`}
                checked={selected.has(col)}
                onCheckedChange={() => toggleColumn(col)}
              />
              <Label
                htmlFor={`col-${col}`}
                className="text-sm truncate cursor-pointer flex-1"
                title={col}
              >
                {col}
              </Label>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.size === 0 || loading}
            className="flex-1"
          >
            {loading ? 'Loading...' : `Continue with ${selected.size} column${selected.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
