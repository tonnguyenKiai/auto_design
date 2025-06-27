"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus } from "lucide-react"
import type { CanvasItem } from "@/app/page"

interface TablePropertiesPanelProps {
  item: CanvasItem
  onUpdateProperties: (properties: any) => void
}

export function TablePropertiesPanel({ item, onUpdateProperties }: TablePropertiesPanelProps) {
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
    if (color === "") {
      delete newRowBackgrounds[rowIndex.toString()]
    } else {
      newRowBackgrounds[rowIndex.toString()] = color
    }
    onUpdateProperties({ rowBackgrounds: newRowBackgrounds })
  }

  const setColumnBackground = (colIndex: number, color: string) => {
    const newColumnBackgrounds = { ...item.properties.columnBackgrounds }
    if (color === "") {
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

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Table Structure</Label>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-2">
            <Label className="text-xs">Rows</Label>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={removeRow} disabled={(item.properties.rows || 4) <= 1}>
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={item.properties.rows || 4}
                onChange={(e) => onUpdateProperties({ rows: Math.max(1, Number.parseInt(e.target.value) || 1) })}
                className="text-center text-xs"
                min="1"
              />
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Columns</Label>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={removeColumn}
                disabled={(item.properties.columns || 10) <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={item.properties.columns || 10}
                onChange={(e) => onUpdateProperties({ columns: Math.max(1, Number.parseInt(e.target.value) || 1) })}
                className="text-center text-xs"
                min="1"
              />
              <Button variant="outline" size="sm" onClick={addColumn}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Column Widths</Label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => (
            <div key={colIndex} className="flex items-center space-x-2">
              <span className="text-xs w-12">Col {colIndex}:</span>
              <Input
                type="number"
                value={item.properties.columnWidths?.[colIndex.toString()] || 80}
                onChange={(e) => setColumnWidth(colIndex, Number.parseInt(e.target.value) || 80)}
                className="text-xs h-6 w-16"
                min="30"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Row Heights</Label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {Array.from({ length: item.properties.rows || 4 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center space-x-2">
              <span className="text-xs w-12">Row {rowIndex}:</span>
              <Input
                type="number"
                value={item.properties.rowHeights?.[rowIndex.toString()] || (rowIndex === 0 ? 25 : 20)}
                onChange={(e) => setRowHeight(rowIndex, Number.parseInt(e.target.value) || 20)}
                className="text-xs h-6 w-16"
                min="18"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Row Backgrounds</Label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {Array.from({ length: item.properties.rows || 4 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center space-x-2">
              <span className="text-xs w-12">Row {rowIndex}:</span>
              <input
                type="color"
                value={item.properties.rowBackgrounds?.[rowIndex.toString()] || "#f5f5f5"}
                onChange={(e) => setRowBackground(rowIndex, e.target.value)}
                className="w-8 h-6 border rounded cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRowBackground(rowIndex, "")}
                className="text-xs px-2 py-1"
              >
                Clear
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Column Backgrounds</Label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => (
            <div key={colIndex} className="flex items-center space-x-2">
              <span className="text-xs w-12">Col {colIndex}:</span>
              <input
                type="color"
                value={item.properties.columnBackgrounds?.[colIndex.toString()] || "#ffffff"}
                onChange={(e) => setColumnBackground(colIndex, e.target.value)}
                className="w-8 h-6 border rounded cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setColumnBackground(colIndex, "")}
                className="text-xs px-2 py-1"
              >
                Clear
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Actions</Label>
        <Button variant="outline" size="sm" onClick={clearAllCells} className="w-full text-xs bg-transparent">
          Clear All Data (Keep Headers)
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Preview</Label>
        <div className="text-xs text-gray-500">
          {item.properties.rows || 4} rows × {item.properties.columns || 10} columns
        </div>
        <div className="text-xs text-blue-600">💡 Use the controls above to adjust column widths and row heights</div>
      </div>
    </div>
  )
}
