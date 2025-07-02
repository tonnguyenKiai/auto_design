'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Merge, Scissors, ArrowRight, ArrowDown } from 'lucide-react'
import type { CanvasItem } from '@/app/page'
import { useState } from 'react'

interface TablePropertiesPanelProps {
  item: CanvasItem
  onUpdateProperties: (properties: any) => void
}

export function TablePropertiesPanel({ item, onUpdateProperties }: TablePropertiesPanelProps) {
  const [mergeStartRow, setMergeStartRow] = useState(0)
  const [mergeStartCol, setMergeStartCol] = useState(0)
  const [mergeEndRow, setMergeEndRow] = useState(0)
  const [mergeEndCol, setMergeEndCol] = useState(1)

  const updateMergeStartRow = (newRow: number) => {
    const validRow = Math.max(0, Math.min(newRow, (item.properties.rows || 4) - 1))
    setMergeStartRow(validRow)
    if (mergeEndRow < validRow) {
      setMergeEndRow(validRow)
    }
  }

  const updateMergeStartCol = (newCol: number) => {
    const validCol = Math.max(0, Math.min(newCol, (item.properties.columns || 10) - 1))
    setMergeStartCol(validCol)
    if (mergeEndCol < validCol) {
      setMergeEndCol(validCol)
    }
  }
  const addRow = () => {
    const newRows = (item.properties.rows || 4) + 1
    onUpdateProperties({ rows: newRows })
  }

  const removeRow = () => {
    const currentRows = item.properties.rows || 4
    if (currentRows > 1) {
      const newRows = currentRows - 1
      // Remove data from the last row
      const newCellData = { ...item.properties.cellData }
      const newRowHeights = { ...item.properties.rowHeights }
      for (let col = 0; col < (item.properties.columns || 10); col++) {
        delete newCellData[`${newRows}-${col}`]
      }
      delete newRowHeights[newRows.toString()]
      onUpdateProperties({ rows: newRows, cellData: newCellData, rowHeights: newRowHeights })
    }
  }

  const addColumn = () => {
    const newColumns = (item.properties.columns || 10) + 1
    onUpdateProperties({ columns: newColumns })
  }

  const removeColumn = () => {
    const currentColumns = item.properties.columns || 10
    if (currentColumns > 1) {
      const newColumns = currentColumns - 1
      // Remove data from the last column
      const newCellData = { ...item.properties.cellData }
      const newColumnWidths = { ...item.properties.columnWidths }
      const newColumnBackgrounds = { ...item.properties.columnBackgrounds }
      for (let row = 0; row < (item.properties.rows || 4); row++) {
        delete newCellData[`${row}-${newColumns}`]
      }
      delete newColumnWidths[newColumns.toString()]
      delete newColumnBackgrounds[newColumns.toString()]
      onUpdateProperties({
        columns: newColumns,
        cellData: newCellData,
        columnWidths: newColumnWidths,
        columnBackgrounds: newColumnBackgrounds,
      })
    }
  }

  const clearAllCells = () => {
    // Keep only header row data
    const newCellData: { [key: string]: string } = {}
    for (let col = 0; col < (item.properties.columns || 10); col++) {
      const headerKey = `0-${col}`
      if (item.properties.cellData?.[headerKey]) {
        newCellData[headerKey] = item.properties.cellData[headerKey]
      }
    }
    onUpdateProperties({ cellData: newCellData })
  }

  const setRowBackground = (rowIndex: number, color: string) => {
    const newRowBackgrounds = { ...item.properties.rowBackgrounds }
    if (color === '') {
      delete newRowBackgrounds[rowIndex.toString()]
    } else {
      newRowBackgrounds[rowIndex.toString()] = color
    }
    onUpdateProperties({ rowBackgrounds: newRowBackgrounds })
  }

  const setColumnBackground = (colIndex: number, color: string) => {
    const newColumnBackgrounds = { ...item.properties.columnBackgrounds }
    if (color === '') {
      delete newColumnBackgrounds[colIndex.toString()]
    } else {
      newColumnBackgrounds[colIndex.toString()] = color
    }
    onUpdateProperties({ columnBackgrounds: newColumnBackgrounds })
  }

  const setColumnWidth = (colIndex: number, width: number) => {
    const newColumnWidths = { ...item.properties.columnWidths }
    newColumnWidths[colIndex.toString()] = Math.max(30, width)
    onUpdateProperties({ columnWidths: newColumnWidths })
  }

  const setRowHeight = (rowIndex: number, height: number) => {
    const newRowHeights = { ...item.properties.rowHeights }
    newRowHeights[rowIndex.toString()] = Math.max(18, height)
    onUpdateProperties({ rowHeights: newRowHeights })
  }

  const mergeCells = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    // Validation
    const maxRows = item.properties.rows || 4
    const maxCols = item.properties.columns || 10

    if (startRow < 0 || startCol < 0 || endRow >= maxRows || endCol >= maxCols) {
      alert('Merge range is out of table bounds!')
      return
    }

    if (startRow > endRow || startCol > endCol) {
      alert('Invalid merge range: end position must be greater than or equal to start position!')
      return
    }

    const colspan = endCol - startCol + 1
    const rowspan = endRow - startRow + 1

    if (colspan <= 1 && rowspan <= 1) {
      alert('Merge range must span at least 2 cells!')
      return
    }

    // Check if any cells in the range are already part of another merge
    const existingMerges = item.properties.mergedCells || {}
    const existingHidden = item.properties.hiddenCells || {}

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellKey = `${row}-${col}`
        if (existingMerges[cellKey] || existingHidden[cellKey]) {
          if (confirm(`Cell (${row},${col}) is already merged. Do you want to split existing merges and continue?`)) {
            // Split any existing merges that conflict
            splitConflictingMerges(startRow, startCol, endRow, endCol)
            break
          } else {
            return
          }
        }
      }
    }

    const newMergedCells = { ...item.properties.mergedCells }
    const newHiddenCells = { ...item.properties.hiddenCells }

    // Set the main cell as merged
    const mainCellKey = `${startRow}-${startCol}`
    newMergedCells[mainCellKey] = { colspan, rowspan }

    // Mark all other cells in the range as hidden
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row !== startRow || col !== startCol) {
          const cellKey = `${row}-${col}`
          newHiddenCells[cellKey] = true
        }
      }
    }

    onUpdateProperties({ mergedCells: newMergedCells, hiddenCells: newHiddenCells })
  }

  const splitConflictingMerges = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    const newMergedCells = { ...item.properties.mergedCells }
    const newHiddenCells = { ...item.properties.hiddenCells }

    // Find and split any merges that overlap with the new range
    Object.entries(newMergedCells).forEach(([cellKey, mergeInfo]) => {
      const [row, col] = cellKey.split('-').map(Number)
      const { colspan = 1, rowspan = 1 } = mergeInfo as { colspan?: number; rowspan?: number }

      // Check if this merge overlaps with our target range
      const mergeEndRow = row + rowspan - 1
      const mergeEndCol = col + colspan - 1

      const overlaps = !(mergeEndRow < startRow || row > endRow || mergeEndCol < startCol || col > endCol)

      if (overlaps) {
        // Remove this merge
        delete newMergedCells[cellKey]

        // Unhide all cells that were part of this merge
        for (let r = row; r <= mergeEndRow; r++) {
          for (let c = col; c <= mergeEndCol; c++) {
            const hiddenCellKey = `${r}-${c}`
            delete newHiddenCells[hiddenCellKey]
          }
        }
      }
    })

    onUpdateProperties({ mergedCells: newMergedCells, hiddenCells: newHiddenCells })
  }

  const splitCell = (row: number, col: number) => {
    const cellKey = `${row}-${col}`
    const newMergedCells = { ...item.properties.mergedCells }
    const newHiddenCells = { ...item.properties.hiddenCells }

    // Get merge info for this cell
    const mergeInfo = newMergedCells[cellKey]
    if (!mergeInfo) return // Cell is not merged

    // Remove the merge info
    delete newMergedCells[cellKey]

    // Unhide all cells that were part of this merge
    const { colspan = 1, rowspan = 1 } = mergeInfo
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        const hiddenCellKey = `${r}-${c}`
        delete newHiddenCells[hiddenCellKey]
      }
    }

    onUpdateProperties({ mergedCells: newMergedCells, hiddenCells: newHiddenCells })
  }

  return (
    <div className='space-y-4'>
      <div>
        <Label className='text-sm font-medium'>Table Structure</Label>

        <div className='grid grid-cols-2 gap-4 mt-2'>
          <div className='space-y-2'>
            <Label className='text-xs'>Rows</Label>
            <div className='flex items-center space-x-1'>
              <Button variant='outline' size='sm' onClick={removeRow} disabled={(item.properties.rows || 4) <= 1}>
                <Minus className='w-3 h-3' />
              </Button>
              <Input
                type='number'
                value={item.properties.rows || 4}
                onChange={e => onUpdateProperties({ rows: Math.max(1, Number.parseInt(e.target.value) || 1) })}
                className='text-center text-xs'
                min='1'
              />
              <Button variant='outline' size='sm' onClick={addRow}>
                <Plus className='w-3 h-3' />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-xs'>Columns</Label>
            <div className='flex items-center space-x-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={removeColumn}
                disabled={(item.properties.columns || 10) <= 1}
              >
                <Minus className='w-3 h-3' />
              </Button>
              <Input
                type='number'
                value={item.properties.columns || 10}
                onChange={e => onUpdateProperties({ columns: Math.max(1, Number.parseInt(e.target.value) || 1) })}
                className='text-center text-xs'
                min='1'
              />
              <Button variant='outline' size='sm' onClick={addColumn}>
                <Plus className='w-3 h-3' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-xs'>Column Widths</Label>
        <div className='max-h-32 overflow-y-auto space-y-1'>
          {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => (
            <div key={colIndex} className='flex items-center space-x-2'>
              <span className='text-xs w-12'>Col {colIndex}:</span>
              <Input
                type='number'
                value={item.properties.columnWidths?.[colIndex.toString()] || 80}
                onChange={e => setColumnWidth(colIndex, Number.parseInt(e.target.value) || 80)}
                className='text-xs h-6 w-16'
                min='30'
              />
              <span className='text-xs text-gray-500'>px</span>
            </div>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-xs'>Row Heights</Label>
        <div className='max-h-32 overflow-y-auto space-y-1'>
          {Array.from({ length: item.properties.rows || 4 }).map((_, rowIndex) => (
            <div key={rowIndex} className='flex items-center space-x-2'>
              <span className='text-xs w-12'>Row {rowIndex}:</span>
              <Input
                type='number'
                value={item.properties.rowHeights?.[rowIndex.toString()] || (rowIndex === 0 ? 25 : 20)}
                onChange={e => setRowHeight(rowIndex, Number.parseInt(e.target.value) || 20)}
                className='text-xs h-6 w-16'
                min='18'
              />
              <span className='text-xs text-gray-500'>px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row Backgrounds - Hidden (use Shift+click cell selection instead) */}
      {false && (
        <div className='space-y-2'>
          <Label className='text-xs'>Row Backgrounds</Label>
          <div className='max-h-32 overflow-y-auto space-y-1'>
            {Array.from({ length: item.properties.rows || 4 }).map((_, rowIndex) => (
              <div key={rowIndex} className='flex items-center space-x-2'>
                <span className='text-xs w-12'>Row {rowIndex}:</span>
                <input
                  type='color'
                  value={item.properties.rowBackgrounds?.[rowIndex.toString()] || '#f5f5f5'}
                  onChange={e => setRowBackground(rowIndex, e.target.value)}
                  className='w-8 h-6 border rounded cursor-pointer'
                />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setRowBackground(rowIndex, '')}
                  className='text-xs px-2 py-1'
                >
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Backgrounds - Hidden (use Shift+click cell selection instead) */}
      {false && (
        <div className='space-y-2'>
          <Label className='text-xs'>Column Backgrounds</Label>
          <div className='max-h-32 overflow-y-auto space-y-1'>
            {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => (
              <div key={colIndex} className='flex items-center space-x-2'>
                <span className='text-xs w-12'>Col {colIndex}:</span>
                <input
                  type='color'
                  value={item.properties.columnBackgrounds?.[colIndex.toString()] || '#ffffff'}
                  onChange={e => setColumnBackground(colIndex, e.target.value)}
                  className='w-8 h-6 border rounded cursor-pointer'
                />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setColumnBackground(colIndex, '')}
                  className='text-xs px-2 py-1'
                >
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cell Merging & Splitting - Hidden (use Shift+click and right-click instead) */}
      {false && (
        <div className='space-y-2'>
          <Label className='text-xs'>Cell Merging & Splitting</Label>

          {/* Simplified Merge Form */}
          <div className='border border-gray-200 rounded p-3 space-y-3'>
            <div className='text-xs font-medium text-gray-700'>Merge Cells</div>

            {/* Column Merge */}
            <div className='space-y-2'>
              <Label className='text-xs text-gray-600'>Merge Columns (Row {mergeStartRow})</Label>
              <div className='flex items-center space-x-2'>
                <span className='text-xs'>From:</span>
                <Input
                  type='number'
                  value={mergeStartCol}
                  onChange={e => updateMergeStartCol(Number.parseInt(e.target.value) || 0)}
                  className='text-xs h-6 w-12'
                  min='0'
                  max={(item.properties.columns || 10) - 1}
                />
                <span className='text-xs'>To:</span>
                <Input
                  type='number'
                  value={mergeEndCol}
                  onChange={e =>
                    setMergeEndCol(Math.max(mergeStartCol, Number.parseInt(e.target.value) || mergeStartCol))
                  }
                  className='text-xs h-6 w-12'
                  min={mergeStartCol}
                  max={(item.properties.columns || 10) - 1}
                />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => mergeCells(mergeStartRow, mergeStartCol, mergeStartRow, mergeEndCol)}
                  className='text-xs bg-blue-50 hover:bg-blue-100 border-blue-200'
                  disabled={mergeStartCol === mergeEndCol}
                >
                  <ArrowRight className='w-3 h-3 mr-1' />
                  Merge
                </Button>
              </div>
            </div>

            {/* Row Merge */}
            <div className='space-y-2'>
              <Label className='text-xs text-gray-600'>Merge Rows (Column {mergeStartCol})</Label>
              <div className='flex items-center space-x-2'>
                <span className='text-xs'>From:</span>
                <Input
                  type='number'
                  value={mergeStartRow}
                  onChange={e => updateMergeStartRow(Number.parseInt(e.target.value) || 0)}
                  className='text-xs h-6 w-12'
                  min='0'
                  max={(item.properties.rows || 4) - 1}
                />
                <span className='text-xs'>To:</span>
                <Input
                  type='number'
                  value={mergeEndRow}
                  onChange={e =>
                    setMergeEndRow(Math.max(mergeStartRow, Number.parseInt(e.target.value) || mergeStartRow))
                  }
                  className='text-xs h-6 w-12'
                  min={mergeStartRow}
                  max={(item.properties.rows || 4) - 1}
                />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => mergeCells(mergeStartRow, mergeStartCol, mergeEndRow, mergeStartCol)}
                  className='text-xs bg-purple-50 hover:bg-purple-100 border-purple-200'
                  disabled={mergeStartRow === mergeEndRow}
                >
                  <ArrowDown className='w-3 h-3 mr-1' />
                  Merge
                </Button>
              </div>
            </div>

            {/* Advanced: Both Columns and Rows */}
            <div className='space-y-2 border-t pt-2'>
              <Label className='text-xs text-gray-600'>Advanced: Merge Both Columns & Rows</Label>
              <div className='flex items-center space-x-1'>
                <span className='text-xs'>
                  ({mergeStartRow},{mergeStartCol})
                </span>
                <span className='text-xs'>→</span>
                <span className='text-xs'>
                  ({mergeEndRow},{mergeEndCol})
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => mergeCells(mergeStartRow, mergeStartCol, mergeEndRow, mergeEndCol)}
                  className='text-xs bg-green-50 hover:bg-green-100 border-green-200'
                  disabled={mergeStartRow === mergeEndRow && mergeStartCol === mergeEndCol}
                >
                  <Merge className='w-3 h-3 mr-1' />
                  Merge Range
                </Button>
              </div>
            </div>

            {/* Split Cell */}
            <div className='border-t pt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => splitCell(mergeStartRow, mergeStartCol)}
                className='text-xs bg-red-50 hover:bg-red-100 border-red-200 w-full'
              >
                <Scissors className='w-3 h-3 mr-1' />
                Split Cell at ({mergeStartRow},{mergeStartCol})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current Merged Cells Display - Hidden (use right-click context menu instead) */}
      {false && (
        <div className='border border-gray-200 rounded p-3 space-y-2'>
          <div className='text-xs font-medium text-gray-700'>Current Merged Cells</div>
          <div className='max-h-32 overflow-y-auto space-y-1'>
            {Object.entries(item.properties.mergedCells || {}).map(([cellKey, mergeInfo]) => {
              const [row, col] = cellKey.split('-').map(Number)
              const { colspan = 1, rowspan = 1 } = mergeInfo as { colspan?: number; rowspan?: number }
              return (
                <div key={cellKey} className='flex items-center justify-between text-xs bg-gray-50 p-2 rounded'>
                  <span className='text-gray-700'>
                    Cell ({row},{col}) → {colspan > 1 && `${colspan} cols`} {rowspan > 1 && `${rowspan} rows`}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => splitCell(row, col)}
                    className='text-xs h-5 px-2 bg-red-50 hover:bg-red-100 border-red-200'
                  >
                    <Scissors className='w-2 h-2' />
                  </Button>
                </div>
              )
            })}
            {(!item.properties.mergedCells || Object.keys(item.properties.mergedCells).length === 0) && (
              <div className='text-xs text-gray-400 italic'>No merged cells</div>
            )}
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <Label className='text-xs'>Actions</Label>
        <Button variant='outline' size='sm' onClick={clearAllCells} className='w-full text-xs bg-transparent'>
          Clear All Data (Keep Headers)
        </Button>
      </div>

      <div className='space-y-2'>
        <Label className='text-xs'>Preview</Label>
        <div className='text-xs text-gray-500'>
          {item.properties.rows || 4} rows × {item.properties.columns || 10} columns
        </div>
        <div className='text-xs text-blue-600'>💡 Use the controls above to adjust column widths and row heights</div>
      </div>
    </div>
  )
}
