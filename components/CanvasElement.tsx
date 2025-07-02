'use client'

import type React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { CanvasItem } from '@/app/page'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, MessageSquare } from 'lucide-react'

interface CanvasElementProps {
  item: CanvasItem
  isSelected: boolean
  onSelect: (ctrlKey: boolean) => void
  onUpdate: (properties: any) => void
  onDelete: () => void
  isMultiSelected?: boolean
  onCellSelectionChange?: (selectedCells: string[]) => void
}

const isTextEditableType = (type: CanvasItem['type']) => {
  return [
    'text',
    'button',
    'label',
    'input',
    'textarea',
    'searchbutton',
    'checkbox-label',
    'radio-label',
    'checkbox',
    'radio',
    'fieldset',
  ].includes(type)
}

export function CanvasElement({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isMultiSelected = false,
  onCellSelectionChange,
}: CanvasElementProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)
  const [editText, setEditText] = useState('')

  const [isCommenting, setIsCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const commentWrapperRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Table cell selection state
  const [selectedCells, setSelectedCells] = useState<string[]>([])
  const [isSelectingCells, setIsSelectingCells] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: {
      type: 'canvas-item',
    },
    disabled: isEditingText || isResizing || isCommenting,
  })

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault() // Prevent default behavior

      // Only toggle if the element is already selected
      if (!isSelected) {
        onSelect(false) // Select the element first
        return
      }

      // Toggle the state only if already selected
      if (item.type === 'checkbox-label' || item.type === 'checkbox') {
        onUpdate({ checked: !item.properties.checked })
      } else if (item.type === 'radio-label' || item.type === 'radio') {
        onUpdate({ checked: !item.properties.checked })
      }
    },
    [item.type, item.properties.checked, onUpdate, isSelected, onSelect],
  )

  // Move all useMemo hooks to the top to fix hooks error
  const checkboxLabelBg = item.properties.checked ? item.properties.checkedBackgroundColor || '#00FFFF' : 'transparent'

  const radioLabelBg = item.properties.checked ? item.properties.checkedBackgroundColor || '#00FFFF' : 'transparent'

  const checkboxLabelElement = useMemo(
    () => (
      <div className='w-full h-full flex items-center space-x-1'>
        <div
          className='relative cursor-pointer flex items-center justify-center'
          style={{
            width: '13px',
            height: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            boxSizing: 'border-box',
          }}
          onClick={handleCheckboxClick}
          onMouseDown={e => e.stopPropagation()}
        >
          {item.properties.checked && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#000000',
                lineHeight: '1',
                fontFamily: 'monospace',
              }}
            >
              ✓
            </div>
          )}
        </div>
        <label
          style={{
            fontSize: item.properties.fontSize || 13,
            fontFamily: 'MS Gothic',
            color: item.properties.color || '#000000',
            backgroundColor: checkboxLabelBg,
            padding: checkboxLabelBg !== 'transparent' ? '1px 3px' : '0',
          }}
          className='select-none text-xs cursor-pointer'
          onClick={handleCheckboxClick}
        >
          {item.properties.label || 'Label'}
        </label>
      </div>
    ),
    [
      item.properties.checked,
      item.properties.label,
      item.properties.fontSize,
      item.properties.color,
      checkboxLabelBg,
      handleCheckboxClick,
    ],
  )

  const radioLabelElement = useMemo(
    () => (
      <div className='w-full h-full flex items-center space-x-1'>
        <div
          className='relative cursor-pointer flex items-center justify-center'
          style={{
            width: '13px',
            height: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            borderRadius: '50%',
            boxSizing: 'border-box',
          }}
          onClick={handleCheckboxClick}
          onMouseDown={e => e.stopPropagation()}
        >
          {item.properties.checked && (
            <div
              style={{
                width: '5px',
                height: '5px',
                backgroundColor: '#000000',
                borderRadius: '50%',
              }}
            />
          )}
        </div>
        <label
          style={{
            fontSize: item.properties.fontSize || 13,
            fontFamily: 'MS Gothic',
            color: item.properties.color || '#000000',
            backgroundColor: radioLabelBg,
            padding: radioLabelBg !== 'transparent' ? '1px 3px' : '0',
          }}
          className='select-none text-xs cursor-pointer'
          onClick={handleCheckboxClick}
        >
          {item.properties.label || 'Label'}
        </label>
      </div>
    ),
    [
      item.properties.checked,
      item.properties.name,
      item.properties.value,
      item.properties.label,
      item.properties.fontSize,
      item.properties.color,
      radioLabelBg,
      handleCheckboxClick,
    ],
  )

  const checkboxElement = useMemo(
    () => (
      <div className='w-full h-full flex items-center justify-center'>
        <div
          className='relative cursor-pointer flex items-center justify-center'
          style={{
            width: '13px',
            height: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            boxSizing: 'border-box',
          }}
          onClick={handleCheckboxClick}
          onMouseDown={e => e.stopPropagation()}
        >
          {item.properties.checked && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#000000',
                lineHeight: '1',
                fontFamily: 'monospace',
              }}
            >
              ✓
            </div>
          )}
        </div>
      </div>
    ),
    [item.properties.checked, handleCheckboxClick],
  )

  const radioElement = useMemo(
    () => (
      <div className='w-full h-full flex items-center justify-center'>
        <div
          className='relative cursor-pointer flex items-center justify-center'
          style={{
            width: '13px',
            height: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            borderRadius: '50%',
            boxSizing: 'border-box',
          }}
          onClick={handleCheckboxClick}
          onMouseDown={e => e.stopPropagation()}
        >
          {item.properties.checked && (
            <div
              style={{
                width: '5px',
                height: '5px',
                backgroundColor: '#000000',
                borderRadius: '50%',
              }}
            />
          )}
        </div>
      </div>
    ),
    [item.properties.checked, item.properties.name, item.properties.value, handleCheckboxClick],
  )

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingText])

  useEffect(() => {
    if (isCommenting && commentTextareaRef.current) {
      commentTextareaRef.current.focus()
      setCommentText(item.properties.comment || '') // Load current comment when opening
    }
  }, [isCommenting, item.properties.comment])

  const handleSaveComment = useCallback(() => {
    // Only update if the comment text has actually changed or if it's a new comment
    if (commentText !== (item.properties.comment || '') || (commentText && !item.properties.comment)) {
      onUpdate({ comment: commentText })
    }
    setIsCommenting(false)
  }, [commentText, item.properties.comment, onUpdate])

  const handleCancelComment = useCallback(() => {
    setIsCommenting(false)
    // Optionally reset commentText to original if needed, but current behavior is fine
  }, [])

  // Effect to handle clicks outside the comment box to save and close it
  useEffect(() => {
    if (!isCommenting) return

    const handleClickOutsideCommentBox = (event: MouseEvent) => {
      if (
        commentWrapperRef.current &&
        !commentWrapperRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(`[data-comment-icon-for="${item.id}"]`)
      ) {
        handleSaveComment()
      }
    }

    document.addEventListener('mousedown', handleClickOutsideCommentBox)
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideCommentBox)
    }
  }, [isCommenting, item.id, handleSaveComment])

  const handleCommentTextareaBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    // If focus moves to an element within the comment box (like Save/Cancel buttons), do nothing.
    // The button click will handle the action.
    if (commentWrapperRef.current && commentWrapperRef.current.contains(event.relatedTarget as Node)) {
      return
    }
    // Otherwise, focus has moved outside the comment box context, so save.
    handleSaveComment()
  }

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: item.width,
        startHeight: item.height,
      }
    },
    [item.width, item.height],
  )

  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const deltaX = e.clientX - resizeRef.current.startX
      const deltaY = e.clientY - resizeRef.current.startY
      const newWidth = Math.max(50, resizeRef.current.startWidth + deltaX)
      const newHeight = Math.max(30, resizeRef.current.startHeight + deltaY)
      onUpdate({ width: newWidth, height: newHeight })
    },
    [isResizing, onUpdate],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  const enterEditMode = useCallback(() => {
    if (!isTextEditableType(item.type) || isCommenting) return

    let currentText = ''
    switch (item.type) {
      case 'text':
        currentText = item.properties.text || 'Sample Text'
        break
      case 'button':
        currentText = item.properties.text || 'Button'
        break
      case 'label':
        currentText = item.properties.text || '品名入力'
        break
      case 'input':
        currentText = item.properties.value || ''
        break
      case 'textarea':
        currentText = item.properties.placeholder || 'Enter your message...'
        break
      case 'searchbutton':
        currentText = item.properties.text || 'Search'
        break
      case 'checkbox-label':
        currentText = item.properties.label || 'Label'
        break
      case 'radio-label':
        currentText = item.properties.label || 'Label'
        break
      case 'checkbox':
        currentText = item.properties.label || 'Label'
        break
      case 'radio':
        currentText = item.properties.label || 'Label'
        break
      case 'fieldset':
        currentText = item.properties.legend || 'Field Set'
        break
      default:
        currentText = ''
    }
    setEditText(currentText)
    setIsEditingText(true)
  }, [item.type, item.properties, isCommenting])

  const handleTextEditSave = useCallback(() => {
    if (!isTextEditableType(item.type)) return

    let propToUpdate: string
    if (item.type === 'input') {
      propToUpdate = 'value'
    } else if (item.type === 'textarea') {
      propToUpdate = 'placeholder'
    } else if (
      item.type === 'checkbox-label' ||
      item.type === 'radio-label' ||
      item.type === 'checkbox' ||
      item.type === 'radio'
    ) {
      propToUpdate = 'label'
    } else if (item.type === 'fieldset') {
      propToUpdate = 'legend'
    } else {
      propToUpdate = 'text'
    }

    // Auto-resize for text and checkbox/radio labels
    if (item.type === 'text' || item.type === 'checkbox-label' || item.type === 'radio-label') {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (context) {
        const fontSize = item.properties.fontSize || (item.type === 'text' ? 14 : 13)
        const fontFamily = item.properties.fontFamily || (item.type === 'text' ? 'Arial' : 'MS Gothic')
        context.font = `${fontSize}px ${fontFamily}`

        if (item.type === 'text') {
          // For text, resize based on text content
          const metrics = context.measureText(editText)
          const newWidth = Math.max(50, metrics.width + 20) // Add padding
          const newHeight = Math.max(20, fontSize + 6) // Add padding
          onUpdate({
            [propToUpdate]: editText,
            width: newWidth,
            height: newHeight,
          })
        } else {
          // For checkbox-label and radio-label, resize based on checkbox + spacing + label
          const checkboxSize = 16 * 0.8 // scaled down in CSS
          const spacing = 4
          const labelMetrics = context.measureText(editText)
          const totalWidth = Math.max(60, checkboxSize + spacing + labelMetrics.width + 10) // Add padding
          const totalHeight = Math.max(16, Math.max(checkboxSize, fontSize) + 4) // Add padding

          const updateData = {
            [propToUpdate]: editText,
            width: totalWidth,
            height: totalHeight,
          }
          onUpdate(updateData)
        }
      }
    } else {
      // For other types, just update the property
      onUpdate({ [propToUpdate]: editText })
    }

    setIsEditingText(false)
  }, [editText, onUpdate, item.type, item.properties])

  const handleTextEditCancel = useCallback(() => {
    setIsEditingText(false)
  }, [])

  // Table cell selection helpers
  const handleCellClick = useCallback(
    (cellKey: string, e: React.MouseEvent) => {
      if (!isSelected) return // Only allow cell selection when table is selected

      // Only handle cell selection when shift key is pressed
      if (e.shiftKey) {
        e.stopPropagation() // Prevent text editing

        if (selectedCells.length > 0) {
          // Range selection with shift+click
          const [startRow, startCol] = selectedCells[0].split('-').map(Number)
          const [endRow, endCol] = cellKey.split('-').map(Number)

          const minRow = Math.min(startRow, endRow)
          const maxRow = Math.max(startRow, endRow)
          const minCol = Math.min(startCol, endCol)
          const maxCol = Math.max(startCol, endCol)

          const rangeCells: string[] = []
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              rangeCells.push(`${r}-${c}`)
            }
          }
          setSelectedCells(rangeCells)
        } else {
          // Start new selection
          setSelectedCells([cellKey])
        }
      } else if (e.ctrlKey || e.metaKey) {
        e.stopPropagation() // Prevent text editing
        // Multi-select with ctrl+click
        setSelectedCells(prev => (prev.includes(cellKey) ? prev.filter(c => c !== cellKey) : [...prev, cellKey]))
      }
      // If no modifier keys, allow normal text editing (don't stop propagation)
    },
    [isSelected, selectedCells],
  )

  const handleCellRightClick = useCallback(
    (cellKey: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!isSelected) return

      // If this cell is selected, show context menu
      if (selectedCells.includes(cellKey) && selectedCells.length > 0) {
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          visible: true,
        })
      }
    },
    [isSelected, selectedCells],
  )

  const mergeSelectedCells = useCallback(() => {
    if (selectedCells.length < 2) return

    // Parse selected cells to get bounds
    const cells = selectedCells.map(key => {
      const [row, col] = key.split('-').map(Number)
      return { row, col }
    })

    const minRow = Math.min(...cells.map(c => c.row))
    const maxRow = Math.max(...cells.map(c => c.row))
    const minCol = Math.min(...cells.map(c => c.col))
    const maxCol = Math.max(...cells.map(c => c.col))

    const colspan = maxCol - minCol + 1
    const rowspan = maxRow - minRow + 1

    // Check if selection forms a rectangle
    const expectedCells = colspan * rowspan
    if (selectedCells.length !== expectedCells) {
      alert('Please select a rectangular range of cells to merge.')
      return
    }

    const newMergedCells = { ...item.properties.mergedCells }
    const newHiddenCells = { ...item.properties.hiddenCells }

    // Remove existing merges in the range first
    selectedCells.forEach(cellKey => {
      if (newMergedCells[cellKey]) {
        delete newMergedCells[cellKey]
      }
      delete newHiddenCells[cellKey]
    })

    // Set the main cell as merged
    const mainCellKey = `${minRow}-${minCol}`
    newMergedCells[mainCellKey] = { colspan, rowspan }

    // Mark other cells as hidden
    selectedCells.forEach(cellKey => {
      if (cellKey !== mainCellKey) {
        newHiddenCells[cellKey] = true
      }
    })

    onUpdate({ mergedCells: newMergedCells, hiddenCells: newHiddenCells })
    setSelectedCells([])
    setContextMenu({ x: 0, y: 0, visible: false })
  }, [selectedCells, item.properties.mergedCells, onUpdate])

  const splitSelectedCells = useCallback(() => {
    if (selectedCells.length === 0) return

    const newMergedCells = { ...item.properties.mergedCells }
    const newHiddenCells = { ...item.properties.hiddenCells }

    selectedCells.forEach(cellKey => {
      const mergeInfo = newMergedCells[cellKey]
      if (mergeInfo) {
        // Remove the merge
        delete newMergedCells[cellKey]

        // Unhide all cells that were part of this merge
        const [row, col] = cellKey.split('-').map(Number)
        const { colspan = 1, rowspan = 1 } = mergeInfo

        for (let r = row; r < row + rowspan; r++) {
          for (let c = col; c < col + colspan; c++) {
            const hiddenCellKey = `${r}-${c}`
            delete newHiddenCells[hiddenCellKey]
          }
        }
      }
    })

    onUpdate({ mergedCells: newMergedCells, hiddenCells: newHiddenCells })
    setSelectedCells([])
    setContextMenu({ x: 0, y: 0, visible: false })
  }, [selectedCells, item.properties.mergedCells, onUpdate])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ x: 0, y: 0, visible: false })
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  // Clear selected cells when table is deselected
  useEffect(() => {
    if (!isSelected && item.type === 'table') {
      setSelectedCells([])
      setContextMenu({ x: 0, y: 0, visible: false })
    }
  }, [isSelected, item.type])

  // Notify parent about cell selection changes
  useEffect(() => {
    if (item.type === 'table' && onCellSelectionChange) {
      onCellSelectionChange(selectedCells)
    }
  }, [selectedCells, item.type, onCellSelectionChange])

  const handleElementClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        isResizing ||
        (e.target as HTMLElement).closest('[data-control-element="true"]') ||
        (e.target as HTMLElement).closest('.comment-textarea-wrapper')
      ) {
        return
      }

      if (isCommenting) {
        return
      }

      // For pure interactive elements (checkbox, radio, table), always select first, don't auto-edit/toggle
      const isPureInteractiveElement = ['checkbox', 'radio', 'table'].includes(item.type)
      const isLabelElement = ['checkbox-label', 'radio-label'].includes(item.type)

      if (isPureInteractiveElement) {
        // Always just select these elements, never auto-edit or auto-toggle
        if (!isSelected || e.ctrlKey) {
          onSelect(e.ctrlKey)
        }
        return
      }

      // For label elements, allow text editing when already selected
      if (isLabelElement) {
        if (!isSelected || e.ctrlKey) {
          onSelect(e.ctrlKey)
        } else {
          // If already selected, allow text editing
          if (isTextEditableType(item.type) && !isEditingText && !isCommenting) {
            enterEditMode()
          }
        }
        return
      }

      // For other elements, keep the original behavior
      if (!isSelected || e.ctrlKey) {
        onSelect(e.ctrlKey)
      } else {
        if (isTextEditableType(item.type) && !isEditingText && !isCommenting) {
          enterEditMode()
        }
      }
    },
    [isSelected, isResizing, isCommenting, isEditingText, onSelect, enterEditMode, item.type],
  )

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'se-resize'
      document.body.style.userSelect = 'none'
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      if (document.body.style.cursor === 'se-resize') document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const handleCommentIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditingText) setIsEditingText(false) // Close text edit if open

    if (isCommenting) {
      // If already commenting, clicking icon again might mean save or just toggle
      handleSaveComment() // Let's assume clicking icon again saves and closes
    } else {
      setCommentText(item.properties.comment || '')
      setIsCommenting(true)
    }
  }

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      // Double-click to enter edit mode for pure interactive elements (not labels)
      const isPureInteractiveElement = ['checkbox', 'radio', 'table'].includes(item.type)

      if (isPureInteractiveElement && isSelected) {
        if (isTextEditableType(item.type) && !isEditingText && !isCommenting) {
          enterEditMode()
        }
      }
    },
    [item.type, isSelected, isEditingText, isCommenting, enterEditMode],
  )

  const renderElement = () => {
    const style = {
      fontSize: item.properties.fontSize || 14,
      fontFamily: item.properties.fontFamily || 'Arial',
      color: item.properties.color || '#000000',
      backgroundColor: item.properties.backgroundColor,
      borderRadius: item.properties.borderRadius || 0,
      padding: item.properties.padding || 0,
      fontWeight: item.properties.fontWeight || 'normal',
      fontStyle: item.properties.fontStyle || 'normal',
      textDecoration: item.properties.textDecoration || 'none',
      textAlign: item.properties.textAlign || 'left',
    }

    if (isEditingText && isTextEditableType(item.type)) {
      const commonInputProps = {
        ref: inputRef as React.RefObject<any>,
        value: editText,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setEditText(e.target.value)
        },
        onBlur: (e: React.FocusEvent) => {
          handleTextEditSave()
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && item.type !== 'textarea') {
            handleTextEditSave()
          } else if (e.key === 'Escape') {
            handleTextEditCancel()
          }
        },
        autoFocus: true,
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }

      switch (item.type) {
        case 'text':
          return (
            <input
              {...commonInputProps}
              type='text'
              style={{
                ...style,
                width: '100%',
                height: '100%',
                border: '1px solid #3b82f6',
                outline: 'none',
                backgroundColor: 'transparent',
                textAlign: 'center',
                padding: '0 4px',
              }}
              className='pointer-events-auto'
            />
          )
        case 'button':
          return (
            <input
              {...commonInputProps}
              type='text'
              style={{
                ...style,
                width: '100%',
                height: '100%',
                border: '1px solid #3b82f6',
                outline: 'none',
                backgroundColor: item.properties.backgroundColor || '#f0f0f0',
                textAlign: 'center',
                padding: item.properties.padding || 4,
                fontFamily: 'MS Gothic',
                boxSizing: 'border-box',
              }}
              className='pointer-events-auto'
            />
          )
        case 'label':
          return (
            <input
              {...commonInputProps}
              type='text'
              style={{
                ...style,
                width: '100%',
                height: '100%',
                border: '1px solid #3b82f6',
                outline: 'none',
                backgroundColor: item.properties.backgroundColor || '#006933',
                textAlign: 'center',
                padding: item.properties.padding || 8,
              }}
              className='pointer-events-auto'
            />
          )
        case 'textarea':
          return (
            <textarea
              {...commonInputProps}
              rows={item.properties.rows || 4}
              placeholder={item.properties.placeholder || 'Enter your message...'}
              style={{
                ...style,
                width: '100%',
                height: '100%',
                border: '1px solid #3b82f6',
                outline: 'none',
                backgroundColor: 'white',
                padding: '4px',
                resize: 'none',
              }}
              className='pointer-events-auto'
            />
          )
        case 'checkbox-label':
        case 'radio-label':
          return (
            <div className='w-full h-full flex items-center space-x-1'>
              <input
                type={item.type === 'checkbox-label' ? 'checkbox' : 'radio'}
                checked={item.properties.checked || false}
                className='cursor-pointer'
                style={{ transform: 'scale(0.8)' }}
                readOnly
                onMouseDown={e => e.stopPropagation()}
              />
              <input
                {...commonInputProps}
                type='text'
                style={{
                  fontSize: item.properties.fontSize || 13,
                  fontFamily: 'MS Gothic',
                  color: item.properties.color || '#000000',
                  border: '1px solid #3b82f6',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  padding: '2px 4px',
                  flex: 1,
                }}
                className='pointer-events-auto'
              />
            </div>
          )
        default:
          return (
            <input
              {...commonInputProps}
              type='text'
              style={{
                ...style,
                width: '100%',
                height: '100%',
                border: '1px solid #3b82f6',
                outline: 'none',
                backgroundColor: 'transparent',
                textAlign: 'center',
                padding: '0 4px',
              }}
              className='pointer-events-auto'
            />
          )
      }
    }

    switch (item.type) {
      case 'text':
        return (
          <div
            style={style}
            className='w-full h-full flex items-center justify-center pointer-events-none select-none px-1'
          >
            {item.properties.text || 'Sample Text'}
          </div>
        )
      case 'label':
        return (
          <div style={style} className='w-full h-full flex items-center justify-center pointer-events-none select-none'>
            {item.properties.text || '品名入力'}
          </div>
        )
      case 'button':
        return (
          <button
            style={{
              ...style,
              backgroundColor: item.properties.backgroundColor || '#f0f0f0',
              borderWidth: item.properties.borderWidth || 2,
              borderColor: item.properties.borderColor || '#d4d0c8',
              borderStyle: item.properties.borderStyle || 'outset',
              borderRadius: item.properties.borderRadius || 0,
              padding: item.properties.padding || 4,
              fontFamily: 'MS Gothic',
              boxSizing: 'border-box',
            }}
            className='w-full h-full pointer-events-none text-xs'
          >
            {item.properties.text || 'Button'}
          </button>
        )
      case 'input':
        const inputBgColor = item.properties.readonly ? '#f0fae6' : item.properties.backgroundColor || '#ffffff'
        const inputBorderColor = item.properties.readonly ? '#e8f7f0' : item.properties.borderColor || '#000000'
        const inputTextColor = item.properties.textColor || '#000000' // Add textColor property

        return (
          <input
            style={{
              ...style,
              color: inputTextColor, // Use textColor for input text
              backgroundColor: inputBgColor,
              borderWidth: item.properties.borderWidth || 1,
              borderColor: inputBorderColor,
              borderStyle: item.properties.borderStyle || 'solid',
              borderRadius: item.properties.borderRadius || 0,
              padding: item.properties.padding || 2,
              fontFamily: 'MS Gothic',
              boxSizing: 'border-box',
            }}
            value={item.properties.value || ''}
            placeholder={item.properties.placeholder || 'Enter text...'}
            className='w-full h-full pointer-events-none text-xs'
            readOnly // Keep this for display mode
          />
        )
      case 'checkbox-label':
        return checkboxLabelElement
      case 'radio-label':
        return radioLabelElement
      case 'checkbox':
        return checkboxElement
      case 'radio':
        return radioElement
      case 'textarea':
        return (
          <Textarea
            style={style}
            placeholder={item.properties.placeholder || 'Enter your message...'}
            rows={item.properties.rows || 4}
            className='w-full h-full pointer-events-none resize-none'
            readOnly
          />
        )
      case 'tabbar':
        return (
          <div className='w-full h-full pointer-events-none' style={{ fontFamily: 'MS Gothic' }}>
            <div className='flex border-b' style={{ borderColor: item.properties.borderColor || '#d4d0c8' }}>
              {(item.properties.tabs || ['Tab 1', 'Tab 2', 'Tab 3']).map((tab: string, index: number) => (
                <div
                  key={index}
                  className='px-3 py-1 text-xs border-r border-t'
                  style={{
                    backgroundColor:
                      (item.properties.activeTab || 0) === index
                        ? '#ffffff'
                        : item.properties.backgroundColor || '#f0f0f0',
                    borderColor: item.properties.borderColor || '#d4d0c8',
                    color: item.properties.activeColor || '#000000',
                    fontFamily: 'MS Gothic',
                    fontSize: item.properties.fontSize || 13,
                    borderTopLeftRadius: index === 0 ? '3px' : '0',
                    borderTopRightRadius: index === (item.properties.tabs || []).length - 1 ? '3px' : '0',
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>
        )
      case 'fieldset':
        return (
          <fieldset
            className='w-full h-full border-2 border-gray-300 rounded p-2 pointer-events-none'
            style={{ borderColor: item.properties.borderColor || '#dee2e6' }}
          >
            <legend style={style} className='px-2 select-none'>
              {item.properties.legend || 'Field Set'}
            </legend>
            <div className='text-xs text-gray-400 mt-2 select-none'></div>
          </fieldset>
        )
      case 'searchbutton':
        return (
          <button
            style={{
              backgroundColor: item.properties.backgroundColor || '#f0f0f0',
              borderWidth: item.properties.borderWidth || 2,
              borderColor: item.properties.borderColor || '#d4d0c8',
              borderStyle: item.properties.borderStyle || 'outset',
              borderRadius: item.properties.borderRadius || 0,
              backgroundImage: "url('/images/search-button.png')",
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            className='w-full h-full pointer-events-none'
            title='Search'
          />
        )
      case 'table':
        return (
          <div
            style={style}
            className={`w-full h-full border border-gray-300 overflow-auto relative ${
              isSelected ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            onClick={e => {
              // Clear cell selection when clicking on table background
              if (e.target === e.currentTarget) {
                setSelectedCells([])
              }
            }}
          >
            {/* Hidden indicators */}
            {false && isSelected && (
              <div className='absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded z-10 pointer-events-none'>
                ✓ Editable
              </div>
            )}
            {false && selectedCells.length > 0 && (
              <div className='absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded z-10 pointer-events-none'>
                {selectedCells.length} cells selected
              </div>
            )}
            <table className='w-full text-xs border-collapse'>
              <tbody>
                {Array.from({ length: item.properties.rows || 4 }).map((_, rowIndex) => {
                  const isHeaderRow = rowIndex === 0
                  const customRowBg = item.properties.rowBackgrounds?.[rowIndex.toString()]
                  const rowHeight = item.properties.rowHeights?.[rowIndex.toString()] || (isHeaderRow ? 25 : 20)

                  return (
                    <tr
                      key={rowIndex}
                      style={{
                        backgroundColor: isHeaderRow
                          ? item.properties.headerBackgroundColor || '#1d4d35'
                          : customRowBg || item.properties.backgroundColor || '#f5f5f5',
                        height: rowHeight,
                      }}
                    >
                      {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => {
                        const cellKey = `${rowIndex}-${colIndex}`
                        const cellValue = item.properties.cellData?.[cellKey] || ''
                        const isCheckboxColumn = item.properties.columnTypes?.[colIndex.toString()] === 'checkbox'
                        const customColBg = item.properties.columnBackgrounds?.[colIndex.toString()]
                        const columnWidth = item.properties.columnWidths?.[colIndex.toString()] || 80

                        // Get cell-specific styles
                        const cellStyles = item.properties.cellStyles?.[cellKey] || {}

                        // Check if this cell is hidden due to being part of a merged cell
                        const isHiddenCell = item.properties.hiddenCells?.[cellKey]
                        if (isHiddenCell) {
                          return null // Don't render hidden cells
                        }

                        // Check if this cell is merged
                        const mergedInfo = item.properties.mergedCells?.[cellKey]
                        const colspan = mergedInfo?.colspan || 1
                        const rowspan = mergedInfo?.rowspan || 1

                        return (
                          <td
                            key={colIndex}
                            className='border border-gray-300 p-1 relative'
                            colSpan={colspan}
                            rowSpan={rowspan}
                            style={{
                              width: colspan > 1 ? columnWidth * colspan : columnWidth,
                              minWidth: colspan > 1 ? columnWidth * colspan : columnWidth,
                              maxWidth: colspan > 1 ? columnWidth * colspan : columnWidth,
                              height: rowspan > 1 ? rowHeight * rowspan : rowHeight,
                              color:
                                cellStyles.color ||
                                (isHeaderRow
                                  ? item.properties.headerColor || '#ffffff'
                                  : item.properties.color || '#000000'),
                              fontWeight:
                                cellStyles.fontWeight ||
                                (isHeaderRow ? item.properties.headerFontWeight || 'bold' : 'normal'),
                              fontSize: cellStyles.fontSize || item.properties.fontSize || 11,
                              backgroundColor: cellStyles.backgroundColor || customColBg || 'inherit',
                              position: 'relative',
                              textAlign: cellStyles.textAlign || 'center',
                              verticalAlign: 'middle',
                              border: selectedCells.includes(cellKey) ? '2px solid #2196f3' : '1px solid #d1d5db',
                              cursor: isSelected ? 'pointer' : 'default',
                            }}
                            onClick={e => handleCellClick(cellKey, e)}
                            onContextMenu={e => handleCellRightClick(cellKey, e)}
                          >
                            {isCheckboxColumn && !isHeaderRow ? (
                              <div className='flex items-center justify-center h-full'>
                                <input
                                  type='checkbox'
                                  checked={cellValue === '✓'}
                                  onChange={e => {
                                    if (isSelected) {
                                      const newCellData = { ...item.properties.cellData }
                                      newCellData[cellKey] = e.target.checked ? '✓' : ''
                                      onUpdate({ cellData: newCellData })
                                    }
                                  }}
                                  className='cursor-pointer'
                                  style={{
                                    transform: 'scale(0.8)',
                                    pointerEvents: isSelected ? 'auto' : 'none',
                                  }}
                                  onMouseDown={e => {
                                    if (isSelected) {
                                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                        e.preventDefault() // Prevent checkbox interaction when selecting cells
                                        handleCellClick(cellKey, e) // Call cell selection logic
                                      }
                                      e.stopPropagation()
                                    }
                                  }}
                                  onClick={e => {
                                    if (isSelected) {
                                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                        e.preventDefault() // Prevent checkbox interaction when selecting cells
                                        // handleCellClick already called in onMouseDown
                                      }
                                      e.stopPropagation()
                                    }
                                  }}
                                  disabled={!isSelected} // Disable until table is selected
                                />
                              </div>
                            ) : (
                              <input
                                type='text'
                                value={cellValue}
                                onChange={e => {
                                  const newCellData = { ...item.properties.cellData }
                                  if (e.target.value === '') delete newCellData[cellKey]
                                  else newCellData[cellKey] = e.target.value
                                  onUpdate({ cellData: newCellData })
                                }}
                                placeholder={isHeaderRow ? '' : ''}
                                className='w-full h-full bg-transparent border-none outline-none resize-none text-xs p-1 rounded'
                                style={{
                                  fontSize: cellStyles.fontSize || item.properties.fontSize || 11,
                                  fontFamily: item.properties.fontFamily || 'MS Gothic',
                                  color:
                                    cellStyles.color ||
                                    (isHeaderRow
                                      ? item.properties.headerColor || '#ffffff'
                                      : item.properties.color || '#000000'),
                                  fontWeight:
                                    cellStyles.fontWeight ||
                                    (isHeaderRow ? item.properties.headerFontWeight || 'bold' : 'normal'),
                                  textAlign: cellStyles.textAlign || 'center',
                                  minHeight: rowHeight - 2,
                                  pointerEvents: isSelected ? 'auto' : 'none', // Only allow interaction when table is selected
                                }}
                                onMouseDown={e => {
                                  if (isSelected) {
                                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                      e.preventDefault() // Prevent focus when selecting cells
                                      handleCellClick(cellKey, e) // Call cell selection logic
                                    }
                                    e.stopPropagation()
                                  }
                                }}
                                onFocus={e => {
                                  if (isSelected) {
                                    e.stopPropagation()
                                  }
                                }}
                                onClick={e => {
                                  if (isSelected) {
                                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                      e.preventDefault() // Prevent editing when selecting cells
                                      // handleCellClick already called in onMouseDown
                                    }
                                    e.stopPropagation()
                                  }
                                }}
                                readOnly={!isSelected} // Make cells read-only until table is selected
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      case 'select':
        return (
          <Select>
            <SelectTrigger style={style} className='w-full h-full pointer-events-none'>
              <SelectValue placeholder='Select option...' />
            </SelectTrigger>
          </Select>
        )
      default:
        return <div>Unknown component</div>
    }
  }

  const elementStyle: React.CSSProperties = {
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: isEditingText || isResizing || isCommenting ? undefined : isDragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 20 : 10, // Ensure selected items stay on top
  }

  // Calculate text bounds for tight border on text elements
  const getTextBounds = () => {
    if (item.type === 'text' && item.properties.text) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (context) {
        context.font = `${item.properties.fontSize || 14}px ${item.properties.fontFamily || 'Arial'}`
        const metrics = context.measureText(item.properties.text)
        const textWidth = metrics.width
        const textHeight = item.properties.fontSize || 14

        // Center the text bounds within the element
        const centerX = item.width / 2
        const centerY = item.height / 2

        return {
          left: centerX - textWidth / 2,
          top: centerY - textHeight / 2,
          width: textWidth,
          height: textHeight,
        }
      }
    }
    return null
  }

  // Calculate checkbox/radio bounds for tight border
  const getCheckboxRadioBounds = () => {
    // Only apply tight bounds for checkbox-label and radio-label, not standalone checkbox/radio
    if (item.type === 'checkbox-label' || item.type === 'radio-label') {
      // Calculate actual bounds for checkbox/radio + label
      const checkboxSize = 16 * 0.8 // scaled down in CSS
      const spacing = 4 // space between checkbox and label
      const labelText = item.properties.label || 'Label'

      // Calculate label width using canvas measurement
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      let labelWidth = 60 // fallback width

      if (context) {
        context.font = `${item.properties.fontSize || 13}px MS Gothic`
        const metrics = context.measureText(labelText)
        labelWidth = metrics.width
      }

      // Total width = checkbox + spacing + label
      const totalWidth = checkboxSize + spacing + labelWidth
      const totalHeight = Math.max(checkboxSize, item.properties.fontSize || 13)

      // Position at the start of the element (left-aligned like the actual content)
      return {
        left: 0,
        top: (item.height - totalHeight) / 2,
        width: Math.min(totalWidth, item.width),
        height: totalHeight,
      }
    }
    return null
  }

  // Calculate bounds for input and textarea elements to ensure border fits content properly
  const getInputTextareaBounds = () => {
    if (item.type === 'input' || item.type === 'textarea') {
      // For input and textarea, border should match exactly the element size
      return {
        left: 0,
        top: 0,
        width: item.width,
        height: item.height,
      }
    }
    return null
  }

  const textBounds = item.type === 'text' ? getTextBounds() : null
  const checkboxRadioBounds =
    item.type === 'checkbox-label' || item.type === 'radio-label' ? getCheckboxRadioBounds() : null
  const inputTextareaBounds = item.type === 'input' || item.type === 'textarea' ? getInputTextareaBounds() : null

  return (
    <div
      ref={setNodeRef}
      style={elementStyle}
      className={`absolute select-none border-0
      ${isDragging ? 'z-50 opacity-50' : isSelected ? 'z-20' : 'z-10'}
    `}
      onClick={handleElementClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => !isSelected && setIsHovered(true)}
      onMouseLeave={() => !isSelected && setIsHovered(false)}
      {...attributes}
      data-canvas-item='true'
    >
      <div className='w-full h-full' {...listeners}>
        {renderElement()}
      </div>

      {/* Selection border */}
      {isSelected && !isCommenting && !isEditingText && (
        <div
          className='absolute border-2 border-blue-500 pointer-events-none'
          style={
            item.type === 'text' && textBounds
              ? {
                  left: textBounds.left,
                  top: textBounds.top,
                  width: textBounds.width,
                  height: textBounds.height,
                }
              : checkboxRadioBounds
              ? {
                  left: checkboxRadioBounds.left,
                  top: checkboxRadioBounds.top,
                  width: checkboxRadioBounds.width,
                  height: checkboxRadioBounds.height,
                }
              : inputTextareaBounds
              ? {
                  left: inputTextareaBounds.left,
                  top: inputTextareaBounds.top,
                  width: inputTextareaBounds.width,
                  height: inputTextareaBounds.height,
                }
              : {
                  left: 0,
                  top: 0,
                  width: item.width,
                  height: item.height,
                }
          }
        />
      )}

      {/* Hover border - only show when not selected */}
      {isHovered && !isCommenting && !isSelected && !isEditingText && (
        <div
          className='absolute border-2 border-blue-400 pointer-events-none opacity-60'
          style={
            item.type === 'text' && textBounds
              ? {
                  left: textBounds.left,
                  top: textBounds.top,
                  width: textBounds.width,
                  height: textBounds.height,
                }
              : checkboxRadioBounds
              ? {
                  left: checkboxRadioBounds.left,
                  top: checkboxRadioBounds.top,
                  width: checkboxRadioBounds.width,
                  height: checkboxRadioBounds.height,
                }
              : inputTextareaBounds
              ? {
                  left: inputTextareaBounds.left,
                  top: inputTextareaBounds.top,
                  width: inputTextareaBounds.width,
                  height: inputTextareaBounds.height,
                }
              : {
                  left: 0,
                  top: 0,
                  width: item.width,
                  height: item.height,
                }
          }
        />
      )}

      {/* Control icons positioned at top center - smaller size */}
      {isSelected && !isDragging && !isResizing && !isCommenting && !isMultiSelected && (
        <>
          <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white border border-gray-300 rounded px-1 py-0.5 shadow-sm z-20'>
            <Button
              data-control-element='true'
              data-comment-icon-for={item.id}
              size='sm'
              variant='ghost'
              className='w-4 h-4 p-0 hover:bg-gray-100'
              onClick={handleCommentIconClick}
              onMouseDown={e => e.stopPropagation()}
              title='Add/View comment'
            >
              <MessageSquare className='w-2 h-2 text-gray-600' />
            </Button>
            <Button
              data-control-element='true'
              size='sm'
              variant='ghost'
              className='w-4 h-4 p-0 hover:bg-red-100'
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
              onMouseDown={e => e.stopPropagation()}
              title='Delete item'
            >
              <Trash2 className='w-2 h-2 text-red-600' />
            </Button>
          </div>

          {/* Resize handle - hide for text, checkbox, radio, checkbox-label, radio-label */}
          {!['text', 'checkbox', 'radio', 'checkbox-label', 'radio-label'].includes(item.type) && (
            <div
              data-control-element='true'
              className='absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize hover:bg-blue-600 rounded-sm z-20'
              style={
                textBounds
                  ? {
                      left: textBounds.left + textBounds.width - 8,
                      top: textBounds.top + textBounds.height - 8,
                    }
                  : checkboxRadioBounds
                  ? {
                      left: checkboxRadioBounds.left + checkboxRadioBounds.width - 8,
                      top: checkboxRadioBounds.top + checkboxRadioBounds.height - 8,
                    }
                  : inputTextareaBounds
                  ? {
                      left: inputTextareaBounds.left + inputTextareaBounds.width - 8,
                      top: inputTextareaBounds.top + inputTextareaBounds.height - 8,
                    }
                  : { bottom: '-0.5rem', right: '-0.5rem' }
              }
              onMouseDown={e => {
                e.stopPropagation()
                handleResizeStart(e)
              }}
              title='Resize item'
            />
          )}
          {/* Decorative corner dots - only show for elements that can be resized */}
          {!['text', 'checkbox', 'radio', 'checkbox-label', 'radio-label'].includes(item.type) && (
            <>
              <div className='absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none' />
              <div className='absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none' />
              <div className='absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none' />
            </>
          )}
        </>
      )}

      {isSelected && isCommenting && (
        <div
          ref={commentWrapperRef}
          className='comment-textarea-wrapper absolute top-full left-0 mt-2 w-[250px] bg-white p-3 rounded-lg shadow-xl z-30 border border-gray-200'
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <Textarea
            ref={commentTextareaRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onBlur={handleCommentTextareaBlur} // Save on blur
            rows={3}
            className='w-full mb-2 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Type your comment...'
          />
          <div className='flex justify-end space-x-2'>
            <Button variant='outline' size='sm' onClick={handleCancelComment} className='text-xs bg-transparent'>
              Cancel
            </Button>
            <Button size='sm' onClick={handleSaveComment} className='text-xs bg-blue-600 hover:bg-blue-700'>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu for Table Cells */}
      {contextMenu.visible && item.type === 'table' && (
        <div
          className='fixed bg-white border border-gray-300 rounded shadow-lg z-50 py-1'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className='block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 whitespace-nowrap'
            onClick={mergeSelectedCells}
            disabled={selectedCells.length < 2}
          >
            🔗 Merge Cells ({selectedCells.length} selected)
          </button>
          <button
            className='block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 whitespace-nowrap'
            onClick={splitSelectedCells}
          >
            ✂️ Split Cells
          </button>
          <hr className='my-1' />
          <button
            className='block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 text-gray-500 whitespace-nowrap'
            onClick={() => setContextMenu({ x: 0, y: 0, visible: false })}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
