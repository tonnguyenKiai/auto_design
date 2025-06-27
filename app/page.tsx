"use client"

import type React from "react"

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import { useState, useRef, useEffect } from "react"
import { ComponentLibrary } from "@/components/ComponentLibrary"
import { Canvas } from "@/components/Canvas"
import { PropertiesPanel } from "@/components/PropertiesPanel"
import { ChatPanel } from "@/components/ChatPanel"
import { MessageSquare } from "lucide-react"
import {
  saveCanvasToStorage,
  loadCanvasFromStorage,
  clearCanvasFromStorage,
  importCanvasFromJSON as importCanvasUtil,
  exportCanvasToJSONFile,
  loadSampleCanvasData,
  type CanvasData,
} from "@/lib/canvas-storage"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid3X3, Search, User, Trash2, Download, FileUp, Server, FolderOpen } from "lucide-react"
import { Type, Square, FileText, Table, ChevronDown, CheckSquare, Circle, AlignLeft, Box, Tag } from "lucide-react"

export interface CanvasItem {
  id: string
  type:
    | "text"
    | "button"
    | "input"
    | "table"
    | "select"
    | "label"
    | "checkbox"
    | "radio"
    | "textarea"
    | "tabbar"
    | "fieldset"
    | "searchbutton"
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

const componentIcons = {
  text: Type,
  button: Square,
  input: FileText,
  table: Table,
  select: ChevronDown,
  label: Tag,
  checkbox: CheckSquare,
  radio: Circle,
  textarea: AlignLeft,
  tabbar: Box,
  fieldset: Box,
  searchbutton: Search,
}

// Helper to render a minimal preview for DragOverlay
const renderPreviewForType = (itemType: string, props: CanvasItem["properties"], width: number, height: number) => {
  const style: React.CSSProperties = {
    width,
    height,
    fontSize: props.fontSize || 12,
    fontFamily: props.fontFamily || "MS Gothic",
    color: props.color || "#000000",
    backgroundColor: props.backgroundColor || "#f0f0f0",
    border: `1px solid ${props.borderColor || "#cccccc"}`,
    borderRadius: props.borderRadius || 0,
    padding: props.padding || 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxSizing: "border-box",
  }

  switch (itemType) {
    case "text":
      return (
        <div style={{ ...style, backgroundColor: "transparent", border: "none" }}>{props.text || "Sample Text"}</div>
      )
    case "button":
      return (
        <button
          style={{
            ...style,
            backgroundColor: props.backgroundColor || "#f0f0f0",
            borderWidth: props.borderWidth || 2,
            borderColor: props.borderColor || "#d4d0c8",
            borderStyle: props.borderStyle || "outset",
          }}
        >
          {props.text || "Button"}
        </button>
      )
    case "input":
      return (
        <input
          type="text"
          placeholder={props.placeholder || "Enter text..."}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || "#ffffff",
            borderWidth: props.borderWidth || 1,
            borderColor: props.borderColor || "#000000",
            borderStyle: props.borderStyle || "solid",
          }}
          readOnly
        />
      )
    case "label":
      return (
        <div
          style={{
            ...style,
            backgroundColor: props.backgroundColor || "#006933",
            color: props.color || "#ffffff",
            textAlign: "center",
          }}
        >
          {props.text || "Label"}
        </div>
      )
    case "checkbox":
      return (
        <div style={{ ...style, backgroundColor: "transparent", border: "none" }}>
          <input type="checkbox" style={{ marginRight: "4px" }} />
          {props.label || "Checkbox"}
        </div>
      )
    case "table":
      return (
        <div style={{ ...style, backgroundColor: "#f5f5f5" }}>
          <div style={{ fontSize: "10px", textAlign: "center" }}>Table</div>
        </div>
      )
    default:
      return (
        <div style={style} className="text-xs">
          {itemType}
        </div>
      )
  }
}

export default function EditorPage() {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [selectedItems, setSelectedItems] = useState<CanvasItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItemProps, setActiveItemProps] = useState<CanvasItem["properties"] | null>(null)
  const [activeItemDimensions, setActiveItemDimensions] = useState<{ width: number; height: number } | null>(null)

  const [isDraggingExistingItem, setIsDraggingExistingItem] = useState(false)
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [canvasId, setCanvasId] = useState<string>("canvas-1")
  const [canvasName, setCanvasName] = useState<string>("My Canvas")
  const [showGrid, setShowGrid] = useState(true)
  const { toast } = useToast()
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>("#e8f7f0")

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true)
  const [isChatPanelMinimized, setIsChatPanelMinimized] = useState(false)

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
    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeId || isRectangleSelecting) return
      const target = e.target as HTMLElement
      const isPropertiesPanelClick =
        target.closest(".properties-panel") ||
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest("[role='listbox']") ||
        target.closest("[role='combobox']")
      const isCanvasElementControl = target.closest('[data-control-element="true"]')
      const isCommentTextarea = target.closest(".comment-textarea-wrapper")
      const isChatPanel = target.closest(".chat-panel")

      if (canvasContainerRef.current && canvasContainerRef.current.contains(target)) {
        const clickedOnItem = target.closest("[data-canvas-item]")
        if (!clickedOnItem && !isCanvasElementControl && !isCommentTextarea && !e.ctrlKey) {
          setSelectedItems([])
        }
      } else if (
        !isPropertiesPanelClick &&
        !target.closest(".component-library") &&
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
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activeId, isRectangleSelecting])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedId = active.id as string
    setActiveId(draggedId)

    // Check if dragging multi-select group
    if (draggedId === "multi-select-group") {
      setIsDraggingExistingItem(true)
      const startPositions = new Map<string, { x: number; y: number }>()
      selectedItems.forEach((si) => {
        startPositions.set(si.id, { x: si.x, y: si.y })
      })
      setDragStartPositions(startPositions)
      return
    }

    const isExisting = active.data.current?.type === "canvas-item"
    setIsDraggingExistingItem(isExisting)

    if (isExisting) {
      const item = canvasItems.find((i) => i.id === draggedId)
      if (item) {
        setActiveItemProps(item.properties)
        setActiveItemDimensions({ width: item.width, height: item.height })

        // If the dragged item is already in selection, use all selected items
        if (selectedItems.find((si) => si.id === draggedId)) {
          const startPositions = new Map<string, { x: number; y: number }>()
          selectedItems.forEach((si) => {
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
      const newItems = canvasItems.map((item) => {
        if (dragStartPositions.has(item.id)) {
          const startPos = dragStartPositions.get(item.id)!
          return { ...item, x: startPos.x + delta.x, y: startPos.y + delta.y }
        }
        return item
      })
      setCanvasItems(newItems)

      // Also update selectedItems state
      setSelectedItems((prevSelected) =>
        prevSelected.map((si) => {
          const startPos = dragStartPositions.get(si.id)
          if (startPos) {
            return { ...si, x: startPos.x + delta.x, y: startPos.y + delta.y }
          }
          return si
        }),
      )
    } else if (!isDraggingExistingItem && over?.id === "canvas" && canvasContainerRef.current) {
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
      //setDragPreview({ x, y, width, height })
    }
    // For single existing item, don't update position in handleDragMove - let dnd-kit handle transform
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    if (isDraggingExistingItem && selectedItems.length > 0 && dragStartPositions.size > 0) {
      // Update final positions for all selected items
      const newItems = canvasItems.map((item) => {
        if (dragStartPositions.has(item.id)) {
          const startPos = dragStartPositions.get(item.id)!
          return { ...item, x: startPos.x + delta.x, y: startPos.y + delta.y }
        }
        return item
      })
      setCanvasItems(newItems)
      setSelectedItems((prevSelected) =>
        prevSelected.map((si) => {
          const startPos = dragStartPositions.get(si.id)
          if (startPos) {
            return { ...si, x: startPos.x + delta.x, y: startPos.y + delta.y }
          }
          return si
        }),
      )
    } else if (!isDraggingExistingItem && over?.id === "canvas" && canvasContainerRef.current) {
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
      setCanvasItems((prev) => [...prev, newItem])
      setSelectedItems([newItem])
    }
    setActiveId(null)
    setActiveItemProps(null)
    setActiveItemDimensions(null)
    setIsDraggingExistingItem(false)
    setDragStartPositions(new Map())
    setDragPreview(null)
  }

  const getDefaultWidth = (type: string) => {
    switch (type) {
      case "text":
        return 150
      case "button":
        return 75
      case "input":
        return 290
      case "table":
        return 600
      case "select":
        return 180
      case "label":
        return 110
      case "checkbox":
        return 150
      case "radio":
        return 150
      case "textarea":
        return 250
      case "tabbar":
        return 300
      case "fieldset":
        return 280
      case "searchbutton":
        return 20
      default:
        return 120
    }
  }

  const getDefaultHeight = (type: string) => {
    switch (type) {
      case "text":
        return 20
      case "button":
        return 20
      case "input":
        return 20
      case "table":
        return 120
      case "select":
        return 20
      case "label":
        return 20
      case "checkbox":
        return 14
      case "radio":
        return 14
      case "textarea":
        return 60
      case "tabbar":
        return 25
      case "fieldset":
        return 100
      case "searchbutton":
        return 20
      default:
        return 20
    }
  }

  const getDefaultProperties = (type: string): CanvasItem["properties"] => {
    const baseProperties = { fontSize: 14, fontFamily: "MS Gothic", color: "#000000", comment: "" }
    switch (type) {
      case "text":
        return { ...baseProperties, text: "Sample Text", fontSize: 14 }
      case "button":
        return {
          ...baseProperties,
          text: "Button",
          fontSize: 14,
          color: "#000000",
          backgroundColor: "#f0f0f0",
          borderWidth: 2,
          borderColor: "#d4d0c8",
          borderStyle: "outset",
          borderRadius: 0,
          padding: 4,
        }
      case "input":
        return {
          ...baseProperties,
          placeholder: "Enter text...",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#000000",
          borderStyle: "solid",
          borderRadius: 0,
          padding: 2,
          readonly: false,
          value: "",
        }
      case "label":
        return {
          ...baseProperties,
          text: "Label",
          fontSize: 13,
          color: "#ffffff",
          backgroundColor: "#006933",
          borderRadius: 0,
          padding: 8,
          textAlign: "center",
        }
      case "checkbox":
        return {
          ...baseProperties,
          label: "Checkbox Label",
          checked: false,
          fontSize: 13,
          color: "#000000",
          checkedBackgroundColor: "#00FFFF",
        }
      case "radio":
        return {
          ...baseProperties,
          label: "Radio Option",
          name: "radioGroup",
          value: "option1",
          checked: false,
          fontSize: 13,
          color: "#000000",
          checkedBackgroundColor: "#00FFFF",
        }
      case "searchbutton":
        return {
          ...baseProperties,
          text: "",
          iconOnly: true,
          backgroundColor: "#f0f0f0",
          borderWidth: 2,
          borderColor: "#d4d0c8",
          borderStyle: "outset",
          borderRadius: 0,
        }
      case "table":
        return {
          ...baseProperties,
          rows: 4,
          columns: 10,
          fontSize: 11,
          fontFamily: "MS Gothic",
          color: "#000000",
          backgroundColor: "#f5f5f5",
          headerBackgroundColor: "#1d4d35",
          headerColor: "#ffffff",
          headerFontWeight: "bold",
          cellData: {
            // Header Row only
            "0-0": "地図",
            "0-1": "請求フラグ",
            "0-2": "取引先CD",
            "0-3": "取引先名1",
            "0-4": "業者CD",
            "0-5": "業者名1",
            "0-6": "現場CD",
            "0-7": "現場名1",
            "0-8": "発行先コード",
            "0-9": "現場住所1",
          },
          columnTypes: {}, // Remove default checkbox columns
          columnWidths: {
            "0": 40,
            "1": 60,
            "2": 70,
            "3": 120,
            "4": 70,
            "5": 120,
            "6": 70,
            "7": 120,
            "8": 80,
            "9": 150,
          },
          rowHeights: {
            "0": 25, // Header row height
          },
          rowBackgrounds: {}, // For custom row backgrounds
          columnBackgrounds: {}, // For custom column backgrounds
        }
      default:
        return { ...baseProperties }
    }
  }

  const updateItemProperties = (itemId: string, newProps: Partial<CanvasItem> | Partial<CanvasItem["properties"]>) => {
    setCanvasItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const finalUpdatedItem: CanvasItem = { ...item }
          const topLevelKeys: (keyof CanvasItem)[] = ["x", "y", "width", "height", "type"]
          const hasTopLevelChanges = topLevelKeys.some((key) => key in newProps)
          if (hasTopLevelChanges) {
            topLevelKeys.forEach((key) => {
              if (key in newProps) {
                ;(finalUpdatedItem as any)[key] = (newProps as any)[key]
              }
            })
            if ("properties" in newProps && typeof (newProps as CanvasItem).properties === "object") {
              finalUpdatedItem.properties = { ...item.properties, ...(newProps as CanvasItem).properties }
            }
          } else {
            finalUpdatedItem.properties = { ...item.properties, ...(newProps as Partial<CanvasItem["properties"]>) }
          }
          return finalUpdatedItem
        }
        return item
      }),
    )
    setSelectedItems((prevSelected) =>
      prevSelected.map((si) => (si.id === itemId ? { ...si, properties: { ...si.properties, ...newProps } } : si)),
    )
  }

  const handleItemSelect = (item: CanvasItem | null, ctrlKey: boolean) => {
    if (!item) {
      setSelectedItems([])
      return
    }
    if (ctrlKey) {
      setSelectedItems((prev) => {
        const isAlreadySelected = prev.find((si) => si.id === item.id)
        if (isAlreadySelected) {
          return prev.filter((si) => si.id !== item.id)
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
      const itemsInRectangle = canvasItems.filter((item) => {
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
  }

  const deleteSelectedItems = () => {
    const idsToDelete = selectedItems.map((item) => item.id)
    setCanvasItems((prev) => prev.filter((item) => !idsToDelete.includes(item.id)))
    setSelectedItems([])
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
      const response = await fetch("/api/save-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentCanvasData),
      })
      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || `Server responded with ${response.status}`)
      }
      const result = await response.json()
      toast({ title: "Saved to Server File", description: result.message })
      return true
    } catch (error) {
      console.error("Failed to save canvas to server file:", error)
      toast({
        title: "Save to Server File Failed",
        description: error instanceof Error ? error.message : "Could not save canvas to server file.",
        variant: "destructive",
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
      toast({ title: "Saved Locally", description: "Canvas also saved to local storage." })
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
    toast({ title: "Downloading JSON", description: "Canvas data is being downloaded." })
  }

  const handleResetCanvas = async () => {
    try {
      const response = await fetch("/api/reset-canvas", { method: "POST" })
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
      toast({ title: "Canvas Reset", description: "Canvas has been reset to its initial state." })
    } catch (error) {
      console.error("Failed to reset canvas:", error)
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Could not reset canvas.",
        variant: "destructive",
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
        toast({ title: "Loaded from Server File", description: `Canvas "${sampleData.name}" loaded.` })
      } else {
        setCanvasItems([])
        setCanvasName("My Canvas")
        setCanvasId("canvas-1")
        toast({ title: "Empty Canvas Initialized", description: "Started with a new empty canvas." })
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load canvas data from server file.",
        variant: "destructive",
      })
      setCanvasItems([])
      setCanvasName("My Canvas")
      setCanvasId("canvas-1")
    }
  }

  const handleImportFromJSONFile = async (file: File) => {
    try {
      const importedData = await importCanvasUtil(file)
      setCanvasItems(importedData.items)
      setCanvasName(importedData.name)
      setCanvasId(importedData.id)
      setSelectedItems([])
      toast({ title: "Canvas Imported", description: `Canvas "${importedData.name}" imported successfully.` })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import canvas. Check file format.",
        variant: "destructive",
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
        <div className="bg-green-600 text-white border-green-600 rounded px-4 py-2 text-sm font-semibold cursor-grabbing">
          {componentLabel}
        </div>
      )
    }

    return null
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const chatPanelHeightClass = isChatPanelMinimized ? "h-12" : "h-1/3"

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50 relative">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <Input
                value={canvasName}
                onChange={(e) => setCanvasName(e.target.value)}
                className="font-semibold text-gray-800 border-0 focus-visible:ring-0 shadow-none w-auto"
                placeholder="Canvas Name"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="検索" className="pl-10 w-64" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">ユーザー</span>
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Canvas Editor</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    className={showGrid ? "bg-blue-50 border-blue-300" : ""}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" /> Grid {showGrid ? "ON" : "OFF"}
                  </Button>
                  <select
                    value={canvasBackgroundColor}
                    onChange={(e) => setCanvasBackgroundColor(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="#e8f7f0">Light Green</option> <option value="#ffffff">White</option>{" "}
                    <option value="#f0f0f0">Light Gray</option> <option value="#f5f5f5">Very Light Gray</option>
                  </select>
                </div>
              </div>
              <div
                className="border-2 border-blue-500 bg-white rounded-lg relative overflow-hidden"
                style={{ width: "1093.75px", height: "562px" }}
              >
                <div ref={canvasContainerRef} data-canvas="true" className="w-full h-full">
                  <Canvas
                    items={canvasItems}
                    selectedItems={selectedItems}
                    onSelectItem={handleItemSelect}
                    onUpdateItem={updateItemProperties}
                    onDeleteItem={deleteSelectedItems}
                    activeId={activeId} // Pass activeId for AlignmentGuides
                    isDraggingExisting={isDraggingExistingItem} // Pass for AlignmentGuides
                    showGrid={showGrid}
                    dragStartPositions={dragStartPositions}
                    canvasBackgroundColor={canvasBackgroundColor}
                    isRectangleSelecting={isRectangleSelecting}
                    rectangleStart={rectangleStart}
                    rectangleEnd={rectangleEnd}
                    onCanvasMouseDown={handleCanvasMouseDown}
                    onCanvasMouseMove={handleCanvasMouseMove}
                    onCanvasMouseUp={handleCanvasMouseUp}
                    onClick={(e) => {
                      if (e.target === e.currentTarget && !e.ctrlKey) {
                        setSelectedItems([])
                      }
                    }}
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">
                  1093.75 × 562
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleLoadFromServerFile}>
                  <FolderOpen className="w-4 h-4 mr-2" /> Load from Server File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fi = document.createElement("input")
                    fi.type = "file"
                    fi.accept = ".json"
                    fi.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0]
                      if (f) handleImportFromJSONFile(f)
                    }
                    fi.click()
                  }}
                >
                  <FileUp className="w-4 h-4 mr-2" /> Import JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                  <Download className="w-4 h-4 mr-2" /> Download JSON
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveToServerFile}>
                  <Server className="w-4 h-4 mr-2" /> Save to Server File
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveToLocalAndServer}>
                  Save (Server & Local)
                </Button>
                <Button variant="destructive" onClick={handleResetCanvas}>
                  <Trash2 className="w-4 h-4 mr-2" /> Reset Canvas
                </Button>
              </div>
            </div>
            <div className="component-library">
              <h3 className="text-sm font-medium mb-3 text-gray-700">Components</h3>
              <ComponentLibrary />
            </div>
          </div>
          <div className="w-80 bg-white border-l border-gray-200 properties-panel flex-shrink-0 overflow-y-auto">
            <Tabs defaultValue="design" className="h-full">
              <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-white z-10">
                <TabsTrigger value="design">Design</TabsTrigger> <TabsTrigger value="content">Content</TabsTrigger>{" "}
                <TabsTrigger value="comment">Comment</TabsTrigger>
              </TabsList>
              <TabsContent value="design" className="h-[calc(100%-3rem)] overflow-y-auto">
                <PropertiesPanel
                  selectedItems={selectedItems}
                  onUpdateProperties={(p) => selectedItems.forEach((item) => updateItemProperties(item.id, p))}
                  tabType="design"
                />
              </TabsContent>
              <TabsContent value="content" className="h-[calc(100%-3rem)] overflow-y-auto">
                <PropertiesPanel
                  selectedItems={selectedItems}
                  onUpdateProperties={(p) => selectedItems.forEach((item) => updateItemProperties(item.id, p))}
                  tabType="content"
                />
              </TabsContent>
              <TabsContent value="comment" className="h-[calc(100%-3rem)] overflow-y-auto p-4">
                {selectedItems.length === 1 && selectedItems[0] ? (
                  selectedItems[0].properties && selectedItems[0].properties.comment !== undefined ? (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700">Comment:</h4>
                      <p className="text-sm p-2 bg-gray-100 rounded border border-gray-200 whitespace-pre-wrap break-words">
                        {selectedItems[0].properties.comment || (
                          <span className="text-gray-400 italic">No comment.</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No comment. Click icon to add.</p>
                  )
                ) : selectedItems.length > 1 ? (
                  <p className="text-sm text-gray-400 italic">Comments not available for multiple selections.</p>
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <div className="text-2xl mb-2">💬</div>
                    <p>Select an element for comments.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {isChatPanelOpen && (
          <div
            className={`fixed bottom-4 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50 chat-panel transition-all duration-300 ease-in-out ${chatPanelHeightClass}`}
          >
            <ChatPanel
              onClose={() => setIsChatPanelOpen(false)}
              isMinimized={isChatPanelMinimized}
              onToggleMinimize={() => setIsChatPanelMinimized(!isChatPanelMinimized)}
            />
          </div>
        )}
        {!isChatPanelOpen && (
          <Button
            onClick={() => setIsChatPanelOpen(true)}
            className="fixed bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg z-50"
            aria-label="Open Chat"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        )}
        <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
      </div>
    </DndContext>
  )
}
