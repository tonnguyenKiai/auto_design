'use client'

import type React from 'react'

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { useState, useRef, useEffect } from 'react'
import { ComponentLibrary } from '@/components/ComponentLibrary'
import { Canvas } from '@/components/Canvas'
import { PropertiesPanel } from '@/components/PropertiesPanel'
import {
  MessageSquare,
  Search,
  ChevronDown,
  User,
  Grid3X3,
  Download,
  Save,
  FolderOpen,
  Trash2,
  FileUp,
  Server,
} from 'lucide-react'
import {
  saveCanvasToStorage,
  loadCanvasFromStorage,
  clearCanvasFromStorage,
  importCanvasFromJSON as importCanvasUtil,
  exportCanvasToJSONFile,
  loadSampleCanvasData,
  type CanvasData,
} from '@/lib/canvas-storage'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface CanvasItem {
  id: string
  type:
    | 'text'
    | 'button'
    | 'input'
    | 'table'
    | 'select'
    | 'label'
    | 'checkbox-label'
    | 'radio-label'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'tabbar'
    | 'fieldset'
    | 'searchbutton'
  x: number
  y: number
  width: number
  height: number
  properties: {
    text?: string
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    comment?: string
    value?: string
    [key: string]: any
  }
}

export default function EditorPage() {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [selectedItems, setSelectedItems] = useState<CanvasItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItemProps, setActiveItemProps] = useState<CanvasItem['properties'] | null>(null)
  const [activeItemDimensions, setActiveItemDimensions] = useState<{ width: number; height: number } | null>(null)

  const [isDraggingExistingItem, setIsDraggingExistingItem] = useState(false)
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [canvasId, setCanvasId] = useState<string>('canvas-1')
  const [canvasName, setCanvasName] = useState<string>('My Canvas')
  const [showGrid, setShowGrid] = useState(true)
  const { toast } = useToast()
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>('#e8f7f0')

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true)
  const [isChatPanelMinimized, setIsChatPanelMinimized] = useState(false)

  // Table cell selection state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedCells, setSelectedCells] = useState<string[]>([])

  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const [isRectangleSelecting, setIsRectangleSelecting] = useState(false)
  const [rectangleStart, setRectangleStart] = useState<{ x: number; y: number } | null>(null)
  const [rectangleEnd, setRectangleEnd] = useState<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => {
    handleLoadFromServerFile()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeId || isRectangleSelecting) return
      const target = e.target as HTMLElement
      const isPropertiesPanelClick =
        target.closest('.properties-panel') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest("[role='listbox']") ||
        target.closest("[role='combobox']")
      const isCanvasElementControl = target.closest('[data-control-element="true"]')
      const isCommentTextarea = target.closest('.comment-textarea-wrapper')
      const isChatPanel = target.closest('.chat-panel')

      if (canvasContainerRef.current && canvasContainerRef.current.contains(target)) {
        const clickedOnItem = target.closest('[data-canvas-item]')
        if (!clickedOnItem && !isCanvasElementControl && !isCommentTextarea && !e.ctrlKey) {
          setSelectedItems([])
        }
      } else if (
        !isPropertiesPanelClick &&
        !target.closest('.component-library') &&
        !isChatPanel &&
        !target.closest("[role='tabpanel']") &&
        !target.closest("[role='tab']") &&
        !isCanvasElementControl &&
        !isCommentTextarea &&
        !e.ctrlKey
      ) {
        setSelectedItems([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeId, isRectangleSelecting])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedId = active.id as string
    setActiveId(draggedId)

    // Set cursor to grabbing for all drag operations
    document.body.style.cursor = 'grabbing'

    // Check if dragging multi-select group
    if (draggedId === 'multi-select-group') {
      setIsDraggingExistingItem(true)
      const startPositions = new Map<string, { x: number; y: number }>()
      selectedItems.forEach(si => {
        startPositions.set(si.id, { x: si.x, y: si.y })
      })
      setDragStartPositions(startPositions)
      return
    }

    const isExisting = active.data.current?.type === 'canvas-item'
    setIsDraggingExistingItem(isExisting)

    if (isExisting) {
      const item = canvasItems.find(i => i.id === draggedId)
      if (item) {
        setActiveItemProps(item.properties)
        setActiveItemDimensions({ width: item.width, height: item.height })

        // If the dragged item is already in selection, use all selected items
        if (selectedItems.find(si => si.id === draggedId)) {
          const startPositions = new Map<string, { x: number; y: number }>()
          selectedItems.forEach(si => {
            startPositions.set(si.id, { x: si.x, y: si.y })
          })
          setDragStartPositions(startPositions)
        } else {
          // If not in selection, select only this item
          setSelectedItems([item])
          const startPositions = new Map<string, { x: number; y: number }>()
          startPositions.set(item.id, { x: item.x, y: item.y })
          setDragStartPositions(startPositions)
        }
      }
    } else {
      // New item from library
      const itemType = draggedId
      setActiveItemProps(getDefaultProperties(itemType))
      setActiveItemDimensions({ width: getDefaultWidth(itemType), height: getDefaultHeight(itemType) })
    }
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta, over } = event

    if (isDraggingExistingItem && selectedItems.length > 1 && dragStartPositions.size > 1) {
      // Only update positions for multi-selection during drag
      const newItems = canvasItems.map(item => {
        if (dragStartPositions.has(item.id)) {
          const startPos = dragStartPositions.get(item.id)!
          return { ...item, x: startPos.x + delta.x, y: startPos.y + delta.y }
        }
        return item
      })
      setCanvasItems(newItems)

      // Also update selectedItems state
      setSelectedItems(prevSelected =>
        prevSelected.map(si => {
          const startPos = dragStartPositions.get(si.id)
          if (startPos) {
            return { ...si, x: startPos.x + delta.x, y: startPos.y + delta.y }
          }
          return si
        }),
      )
    } else if (!isDraggingExistingItem && over?.id === 'canvas' && canvasContainerRef.current) {
      // Handle new items from library - calculate position more accurately
      const itemType = active.id as string
      const width = getDefaultWidth(itemType)
      const height = getDefaultHeight(itemType)
      const canvasRect = canvasContainerRef.current.getBoundingClientRect()
      const mouseX = mousePositionRef.current.x
      const mouseY = mousePositionRef.current.y

      // More accurate position calculation
      const x = Math.max(0, mouseX - canvasRect.left - width / 2)
      const y = Math.max(0, mouseY - canvasRect.top - height / 2 - 24) // Adjust for canvas header
    }
    // For single existing item, don't update position in handleDragMove - let dnd-kit handle transform
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    if (isDraggingExistingItem && selectedItems.length > 0 && dragStartPositions.size > 0) {
      // Update final positions for all selected items
      const newItems = canvasItems.map(item => {
        if (dragStartPositions.has(item.id)) {
          const startPos = dragStartPositions.get(item.id)!
          return { ...item, x: startPos.x + delta.x, y: startPos.y + delta.y }
        }
        return item
      })
      setCanvasItems(newItems)
      setSelectedItems(prevSelected =>
        prevSelected.map(si => {
          const startPos = dragStartPositions.get(si.id)
          if (startPos) {
            return { ...si, x: startPos.x + delta.x, y: startPos.y + delta.y }
          }
          return si
        }),
      )
    } else if (!isDraggingExistingItem && over?.id === 'canvas' && canvasContainerRef.current) {
      const itemType = active.id as string
      const width = getDefaultWidth(itemType)
      const height = getDefaultHeight(itemType)
      const canvasRect = canvasContainerRef.current.getBoundingClientRect()
      const mouseX = mousePositionRef.current.x
      const mouseY = mousePositionRef.current.y

      // Use the same calculation as in dragMove for consistency
      const x = Math.max(0, mouseX - canvasRect.left - width / 2)
      const y = Math.max(0, mouseY - canvasRect.top - height / 2 - 24) // Adjust for canvas header

      const newItem: CanvasItem = {
        id: `${itemType}-${Date.now()}`,
        type: itemType as any,
        x,
        y,
        width,
        height,
        properties: getDefaultProperties(itemType),
      }
      setCanvasItems(prev => [...prev, newItem])
      setSelectedItems([newItem])
    }
    setActiveId(null)
    setActiveItemProps(null)
    setActiveItemDimensions(null)
    setIsDraggingExistingItem(false)
    setDragStartPositions(new Map())
    setDragPreview(null)

    // Reset cursor after drag
    document.body.style.cursor = ''
  }

  const getDefaultWidth = (type: string) => {
    switch (type) {
      case 'text':
        return 150
      case 'button':
        return 75
      case 'input':
        return 290
      case 'table':
        return 600
      case 'select':
        return 180
      case 'label':
        return 110
      case 'checkbox-label':
        return 100
      case 'radio-label':
        return 100
      case 'checkbox':
        return 16
      case 'radio':
        return 16
      case 'textarea':
        return 250
      case 'tabbar':
        return 300
      case 'fieldset':
        return 280
      case 'searchbutton':
        return 20
      default:
        return 120
    }
  }

  const getDefaultHeight = (type: string) => {
    switch (type) {
      case 'text':
        return 20
      case 'button':
        return 20
      case 'input':
        return 20
      case 'table':
        return 120
      case 'select':
        return 20
      case 'label':
        return 20
      case 'checkbox-label':
        return 16
      case 'radio-label':
        return 16
      case 'checkbox':
        return 16
      case 'radio':
        return 16
      case 'textarea':
        return 60
      case 'tabbar':
        return 25
      case 'fieldset':
        return 100
      case 'searchbutton':
        return 20
      default:
        return 20
    }
  }

  const getDefaultProperties = (type: string): CanvasItem['properties'] => {
    const baseProperties = { fontSize: 14, fontFamily: 'MS Gothic', color: '#000000', comment: '' }
    switch (type) {
      case 'text':
        return { ...baseProperties, text: 'Sample Text', fontSize: 14 }
      case 'button':
        return {
          ...baseProperties,
          text: 'Button',
          fontSize: 14,
          color: '#000000',
          backgroundColor: '#f0f0f0',
          borderWidth: 2,
          borderColor: '#d4d0c8',
          borderStyle: 'outset',
          borderRadius: 0,
          padding: 4,
        }
      case 'input':
        return {
          ...baseProperties,
          placeholder: 'Enter text...',
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#000000',
          borderStyle: 'solid',
          borderRadius: 0,
          padding: 2,
          readonly: false,
          value: '',
        }
      case 'label':
        return {
          ...baseProperties,
          text: 'Label',
          fontSize: 13,
          color: '#ffffff',
          backgroundColor: '#006933',
          borderRadius: 0,
          padding: 8,
          textAlign: 'center',
        }
      case 'checkbox-label':
        return {
          ...baseProperties,
          label: 'Label',
          checked: false,
          fontSize: 13,
          color: '#000000',
          checkedBackgroundColor: '#00FFFF',
        }
      case 'radio-label':
        return {
          ...baseProperties,
          label: 'Label',
          name: 'radioGroup',
          value: 'option1',
          checked: false,
          fontSize: 13,
          color: '#000000',
          checkedBackgroundColor: '#00FFFF',
        }
      case 'checkbox':
        return {
          ...baseProperties,
          checked: false,
          checkedBackgroundColor: '#00FFFF',
        }
      case 'radio':
        return {
          ...baseProperties,
          name: 'radioGroup',
          value: 'option1',
          checked: false,
          checkedBackgroundColor: '#00FFFF',
        }
      case 'searchbutton':
        return {
          ...baseProperties,
          text: '',
          iconOnly: true,
          backgroundColor: '#f0f0f0',
          borderWidth: 2,
          borderColor: '#d4d0c8',
          borderStyle: 'outset',
          borderRadius: 0,
        }
      case 'table':
        return {
          ...baseProperties,
          rows: 4,
          columns: 10,
          fontSize: 11,
          fontFamily: 'MS Gothic',
          color: '#000000',
          backgroundColor: '#f5f5f5',
          headerBackgroundColor: '#1d4d35',
          headerColor: '#ffffff',
          headerFontWeight: 'bold',
          cellData: {
            // Header Row only
            '0-0': '地図',
            '0-1': '請求フラグ',
            '0-2': '取引先CD',
            '0-3': '取引先名1',
            '0-4': '業者CD',
            '0-5': '業者名1',
            '0-6': '現場CD',
            '0-7': '現場名1',
            '0-8': '発行先コード',
            '0-9': '現場住所1',
          },
          columnTypes: {}, // Remove default checkbox columns
          columnWidths: {
            '0': 40,
            '1': 60,
            '2': 70,
            '3': 120,
            '4': 70,
            '5': 120,
            '6': 70,
            '7': 120,
            '8': 80,
            '9': 150,
          },
          rowHeights: {
            '0': 25, // Header row height
          },
          rowBackgrounds: {}, // For custom row backgrounds
          columnBackgrounds: {}, // For custom column backgrounds
          mergedCells: {}, // For merged/spanned cells: { 'row-col': { colspan: 2, rowspan: 1 } }
          hiddenCells: {}, // For cells that are hidden due to being spanned: { 'row-col': true }
        }
      default:
        return { ...baseProperties }
    }
  }

  const updateItemProperties = (itemId: string, newProps: Partial<CanvasItem> | Partial<CanvasItem['properties']>) => {
    setCanvasItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const finalUpdatedItem: CanvasItem = { ...item }
          const topLevelKeys: (keyof CanvasItem)[] = ['x', 'y', 'width', 'height', 'type']

          // Update top-level properties
          topLevelKeys.forEach(key => {
            if (key in newProps) {
              ;(finalUpdatedItem as any)[key] = (newProps as any)[key]
            }
          })

          // Update properties object
          if ('properties' in newProps && typeof (newProps as CanvasItem).properties === 'object') {
            // If there's a properties object, merge it
            finalUpdatedItem.properties = { ...item.properties, ...(newProps as CanvasItem).properties }
          } else {
            // Otherwise, treat non-top-level keys as properties
            const propertyUpdates: Partial<CanvasItem['properties']> = {}
            Object.keys(newProps).forEach(key => {
              if (!topLevelKeys.includes(key as keyof CanvasItem)) {
                propertyUpdates[key] = (newProps as any)[key]
              }
            })
            finalUpdatedItem.properties = { ...item.properties, ...propertyUpdates }
          }

          return finalUpdatedItem
        }
        return item
      }),
    )
    setSelectedItems(prevSelected =>
      prevSelected.map(si => {
        if (si.id === itemId) {
          const updatedItem = { ...si }
          // Update top-level properties
          const topLevelKeys: (keyof CanvasItem)[] = ['x', 'y', 'width', 'height', 'type']
          topLevelKeys.forEach(key => {
            if (key in newProps) {
              ;(updatedItem as any)[key] = (newProps as any)[key]
            }
          })

          // Update properties
          if ('properties' in newProps && typeof (newProps as CanvasItem).properties === 'object') {
            updatedItem.properties = { ...si.properties, ...(newProps as CanvasItem).properties }
          } else {
            const propertyUpdates: Partial<CanvasItem['properties']> = {}
            Object.keys(newProps).forEach(key => {
              if (!topLevelKeys.includes(key as keyof CanvasItem)) {
                propertyUpdates[key] = (newProps as any)[key]
              }
            })
            updatedItem.properties = { ...si.properties, ...propertyUpdates }
          }

          return updatedItem
        }
        return si
      }),
    )
  }

  const handleItemSelect = (item: CanvasItem | null, ctrlKey: boolean) => {
    if (!item) {
      setSelectedItems([])
      return
    }
    if (ctrlKey) {
      setSelectedItems(prev => {
        const isAlreadySelected = prev.find(si => si.id === item.id)
        if (isAlreadySelected) {
          return prev.filter(si => si.id !== item.id)
        } else {
          return [...prev, item]
        }
      })
    } else {
      setSelectedItems([item])
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasContainerRef.current?.querySelector('[data-canvas-droppable="true"]') && !e.ctrlKey) {
      const rect = canvasContainerRef.current?.getBoundingClientRect()
      if (rect) {
        setIsRectangleSelecting(true)
        setRectangleStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setRectangleEnd(null)
        if (!e.ctrlKey) {
          setSelectedItems([])
        }
        // Set crosshair cursor for rectangle selection
        document.body.style.cursor = 'crosshair'
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isRectangleSelecting && rectangleStart) {
      const rect = canvasContainerRef.current?.getBoundingClientRect()
      if (rect) {
        setRectangleEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
  }

  const handleCanvasMouseUp = () => {
    if (isRectangleSelecting && rectangleStart && rectangleEnd) {
      const minX = Math.min(rectangleStart.x, rectangleEnd.x)
      const maxX = Math.max(rectangleStart.x, rectangleEnd.x)
      const minY = Math.min(rectangleStart.y, rectangleEnd.y)
      const maxY = Math.max(rectangleStart.y, rectangleEnd.y)
      const itemsInRectangle = canvasItems.filter(item => {
        const itemRect = {
          left: item.x,
          right: item.x + item.width,
          top: item.y,
          bottom: item.y + item.height,
        }
        return itemRect.left < maxX && itemRect.right > minX && itemRect.top < maxY && itemRect.bottom > minY
      })
      setSelectedItems(itemsInRectangle)
    }
    setIsRectangleSelecting(false)
    setRectangleStart(null)
    setRectangleEnd(null)

    // Reset cursor after rectangle selection
    document.body.style.cursor = ''
  }

  const deleteSelectedItems = () => {
    const idsToDelete = selectedItems.map(item => item.id)
    setCanvasItems(prev => prev.filter(item => !idsToDelete.includes(item.id)))
    setSelectedItems([])
  }

  const handleCellSelectionChange = (itemId: string, selectedCells: string[]) => {
    setSelectedTableId(itemId)
    setSelectedCells(selectedCells)
  }

  const updateSelectedCellProperties = (properties: any) => {
    if (!selectedTableId || selectedCells.length === 0) return

    // Find the table item
    const tableItem = canvasItems.find(item => item.id === selectedTableId)
    if (!tableItem || tableItem.type !== 'table') return

    // Update cell properties for selected cells
    const newCellStyles = { ...(tableItem.properties.cellStyles || {}) }

    selectedCells.forEach(cellKey => {
      if (!newCellStyles[cellKey]) {
        newCellStyles[cellKey] = {}
      }
      newCellStyles[cellKey] = { ...newCellStyles[cellKey], ...properties }
    })

    updateItemProperties(selectedTableId, { cellStyles: newCellStyles })
  }

  const saveToServerFile = async () => {
    const currentCanvasData: CanvasData = {
      id: canvasId,
      name: canvasName,
      createdAt: loadCanvasFromStorage(canvasId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: canvasItems,
    }
    try {
      const response = await fetch('/api/save-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCanvasData),
      })
      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || `Server responded with ${response.status}`)
      }
      const result = await response.json()
      toast({ title: 'Saved to Server File', description: result.message })
      return true
    } catch (error) {
      console.error('Failed to save canvas to server file:', error)
      toast({
        title: 'Save to Server File Failed',
        description: error instanceof Error ? error.message : 'Could not save canvas to server file.',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleSaveToLocalAndServer = async () => {
    const serverSaveSuccess = await saveToServerFile()
    if (serverSaveSuccess) {
      const currentCanvasData: CanvasData = {
        id: canvasId,
        name: canvasName,
        createdAt: loadCanvasFromStorage(canvasId)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: canvasItems,
      }
      saveCanvasToStorage(currentCanvasData)
      toast({ title: 'Saved Locally', description: 'Canvas also saved to local storage.' })
    }
  }

  const handleDownloadJSON = () => {
    const currentCanvasData: CanvasData = {
      id: canvasId,
      name: canvasName,
      createdAt: loadCanvasFromStorage(canvasId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: canvasItems,
    }
    exportCanvasToJSONFile(currentCanvasData)
    toast({ title: 'Downloading JSON', description: 'Canvas data is being downloaded.' })
  }

  const handleResetCanvas = async () => {
    try {
      const response = await fetch('/api/reset-canvas', { method: 'POST' })
      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || `Server responded with ${response.status}`)
      }
      const result = await response.json()
      setCanvasItems(result.data.items)
      setCanvasName(result.data.name)
      setCanvasId(result.data.id)
      setSelectedItems([])
      clearCanvasFromStorage(canvasId)
      toast({ title: 'Canvas Reset', description: 'Canvas has been reset to its initial state.' })
    } catch (error) {
      console.error('Failed to reset canvas:', error)
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Could not reset canvas.',
        variant: 'destructive',
      })
    }
  }

  const handleLoadFromServerFile = async () => {
    try {
      const sampleData = await loadSampleCanvasData()
      if (sampleData) {
        setCanvasItems(sampleData.items)
        setCanvasName(sampleData.name)
        setCanvasId(sampleData.id)
        setSelectedItems([])
        toast({ title: 'Loaded from Server File', description: `Canvas "${sampleData.name}" loaded.` })
      } else {
        setCanvasItems([])
        setCanvasName('My Canvas')
        setCanvasId('canvas-1')
        toast({ title: 'Empty Canvas Initialized', description: 'Started with a new empty canvas.' })
      }
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: 'Failed to load canvas data from server file.',
        variant: 'destructive',
      })
      setCanvasItems([])
      setCanvasName('My Canvas')
      setCanvasId('canvas-1')
    }
  }

  const handleImportFromJSONFile = async (file: File) => {
    try {
      const importedData = await importCanvasUtil(file)
      setCanvasItems(importedData.items)
      setCanvasName(importedData.name)
      setCanvasId(importedData.id)
      setSelectedItems([])
      toast({ title: 'Canvas Imported', description: `Canvas "${importedData.name}" imported successfully.` })
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import canvas. Check file format.',
        variant: 'destructive',
      })
    }
  }

  const renderDragOverlay = () => {
    if (!activeId) return null

    // For existing items, no overlay
    if (isDraggingExistingItem) {
      return null
    }

    // For new items from library, show the green button style
    if (!isDraggingExistingItem && activeItemProps && activeItemDimensions) {
      const componentLabel = activeId.charAt(0).toUpperCase() + activeId.slice(1)
      return (
        <div className='bg-green-600 text-white border-green-600 rounded px-4 py-2 text-sm font-semibold cursor-grabbing'>
          {componentLabel}
        </div>
      )
    }

    return null
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className='h-screen flex flex-col bg-gray-100'>
        {/* Header - Dark Green */}
        <div className='h-12 bg-[#1d4d35] flex items-center justify-between px-4'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center'>
                <div className='w-6 h-6 bg-[#1d4d35] rounded-full'></div>
              </div>
              <span className='text-white font-medium text-sm'>Logo</span>
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input placeholder='受入入力' className='pl-10 w-64 h-8 bg-white border-gray-300 text-sm' />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <span className='text-white text-sm'>ユーザー</span>
            <ChevronDown className='w-4 h-4 text-white' />
            <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center'>
              <User className='w-5 h-5 text-[#1d4d35]' />
            </div>
          </div>
        </div>

        <div className='flex-1 flex overflow-hidden'>
          {/* Main Content Area */}
          <div className='flex-1 flex flex-col'>
            {/* Component Toolbar */}
            <div className='bg-gray-200 border-b border-gray-300 px-4 py-2'>
              <div className='flex items-center justify-between'>
                <div className='component-library flex-1'>
                  <ComponentLibrary />
                </div>
                <div className='flex items-center space-x-1 ml-4'>
                  {/* Action buttons */}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowGrid(!showGrid)}
                    className={`h-7 px-2 text-xs ${showGrid ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    <Grid3X3 className='w-3 h-3 mr-1' /> Grid
                  </Button>
                  <Button variant='outline' size='sm' onClick={handleLoadFromServerFile} className='h-7 px-2 text-xs'>
                    <FolderOpen className='w-3 h-3 mr-1' /> Load
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const fi = document.createElement('input')
                      fi.type = 'file'
                      fi.accept = '.json'
                      fi.onchange = e => {
                        const f = (e.target as HTMLInputElement).files?.[0]
                        if (f) handleImportFromJSONFile(f)
                      }
                      fi.click()
                    }}
                    className='h-7 px-2 text-xs'
                  >
                    <FileUp className='w-3 h-3 mr-1' /> Import
                  </Button>
                  <Button variant='outline' size='sm' onClick={handleDownloadJSON} className='h-7 px-2 text-xs'>
                    <Download className='w-3 h-3 mr-1' /> Export
                  </Button>
                  <Button className='bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs' onClick={saveToServerFile}>
                    <Server className='w-3 h-3 mr-1' /> Save
                  </Button>
                  <Button
                    className='bg-green-600 hover:bg-green-700 h-7 px-2 text-xs'
                    onClick={handleSaveToLocalAndServer}
                  >
                    <Save className='w-3 h-3 mr-1' /> Save All
                  </Button>
                  <Button variant='destructive' onClick={handleResetCanvas} className='h-7 px-2 text-xs'>
                    <Trash2 className='w-3 h-3 mr-1' /> Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className='flex-1 p-4 bg-gray-100 overflow-auto'>
              <div
                className='bg-white border border-gray-300 rounded relative overflow-hidden mx-auto'
                style={{ width: '1000px', height: '600px' }}
              >
                <div ref={canvasContainerRef} data-canvas='true' className='w-full h-full'>
                  <Canvas
                    items={canvasItems}
                    selectedItems={selectedItems}
                    onSelectItem={handleItemSelect}
                    onUpdateItem={updateItemProperties}
                    onDeleteItem={deleteSelectedItems}
                    activeId={activeId}
                    isDraggingExisting={isDraggingExistingItem}
                    showGrid={showGrid}
                    dragStartPositions={dragStartPositions}
                    canvasBackgroundColor={canvasBackgroundColor}
                    isRectangleSelecting={isRectangleSelecting}
                    rectangleStart={rectangleStart}
                    rectangleEnd={rectangleEnd}
                    onCanvasMouseDown={handleCanvasMouseDown}
                    onCanvasMouseMove={handleCanvasMouseMove}
                    onCanvasMouseUp={handleCanvasMouseUp}
                    onClick={e => {
                      if (e.target === e.currentTarget && !e.ctrlKey) {
                        setSelectedItems([])
                      }
                    }}
                    onCellSelectionChange={handleCellSelectionChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties Panel */}
          <div className='w-80 bg-white border-l border-gray-300 properties-panel flex-shrink-0 overflow-y-auto'>
            <Tabs defaultValue='design' className='h-full'>
              <TabsList className='grid w-full grid-cols-2 sticky top-0 bg-white z-10 border-b border-gray-200'>
                <TabsTrigger value='design' className='text-sm'>
                  Design
                </TabsTrigger>
                <TabsTrigger value='comment' className='text-sm'>
                  Comment
                </TabsTrigger>
              </TabsList>
              <TabsContent value='design' className='h-[calc(100%-3rem)] overflow-y-auto'>
                <PropertiesPanel
                  selectedItems={selectedItems}
                  onUpdateProperties={p => selectedItems.forEach(item => updateItemProperties(item.id, p))}
                  tabType='design'
                  selectedTableId={selectedTableId}
                  selectedCells={selectedCells}
                  onUpdateCellProperties={updateSelectedCellProperties}
                />
              </TabsContent>
              <TabsContent value='comment' className='h-[calc(100%-3rem)] overflow-y-auto p-4'>
                {selectedItems.length === 1 && selectedItems[0] ? (
                  selectedItems[0].properties && selectedItems[0].properties.comment !== undefined ? (
                    <div>
                      <h4 className='font-medium mb-2 text-gray-700'>Comment:</h4>
                      <p className='text-sm p-2 bg-gray-100 rounded border border-gray-200 whitespace-pre-wrap break-words'>
                        {selectedItems[0].properties.comment || (
                          <span className='text-gray-400 italic'>No comment.</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-400 italic'>No comment. Click icon to add.</p>
                  )
                ) : selectedItems.length > 1 ? (
                  <p className='text-sm text-gray-400 italic'>Comments not available for multiple selections.</p>
                ) : (
                  <div className='text-center text-gray-500 mt-8'>
                    <div className='text-2xl mb-2'>💬</div>
                    <p>Select an element for comments.</p>
                  </div>
                )}

                {/* Chat AI Section */}
                <div className='mt-8 border-t border-gray-200 pt-4'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='font-medium text-gray-700 text-sm'>Chat AI</h4>
                      <MessageSquare className='w-4 h-4 text-gray-500' />
                    </div>
                    <div className='space-y-2'>
                      <div className='bg-white p-2 rounded text-xs text-gray-600'>みんなの広場</div>
                      <Input placeholder='メッセージを入力...' className='h-8 text-xs' />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
      </div>
    </DndContext>
  )
}
