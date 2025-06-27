"use client"

import type React from "react"
import { useDroppable, useDndContext, useDraggable } from "@dnd-kit/core"
import type { CanvasItem } from "@/app/page"
import { CanvasElement } from "./CanvasElement"
import { AlignmentGuides } from "./AlignmentGuides"
import { useMemo } from "react"

interface CanvasProps {
  items: CanvasItem[]
  selectedItems: CanvasItem[]
  onSelectItem: (item: CanvasItem, ctrlKey: boolean) => void
  onUpdateItem: (itemId: string, properties: any) => void
  onDeleteItem: () => void
  dragPreview?: { x: number; y: number; width: number; height: number } | null
  activeId?: string | null
  showGrid?: boolean
  isDraggingExisting?: boolean
  dragStartPositions?: Map<string, { x: number; y: number }>
  canvasBackgroundColor?: string
  isRectangleSelecting?: boolean
  rectangleStart?: { x: number; y: number } | null
  rectangleEnd?: { x: number; y: number } | null
  onCanvasMouseDown?: (e: React.MouseEvent) => void
  onCanvasMouseMove?: (e: React.MouseEvent) => void
  onCanvasMouseUp?: () => void
  onClick?: (e: React.MouseEvent) => void
}

function MultiSelectDraggable({
  boundingBox,
  selectedItems,
}: {
  boundingBox: { x: number; y: number; width: number; height: number }
  selectedItems: CanvasItem[]
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "multi-select-group",
    data: {
      type: "canvas-item",
      items: selectedItems,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute border-2 border-purple-500 pointer-events-auto z-20 cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      }}
      {...attributes}
      {...listeners}
      title="Drag to move all selected items"
    />
  )
}

export function Canvas({
  items,
  selectedItems,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  dragPreview,
  activeId,
  showGrid = true,
  isDraggingExisting = false,
  dragStartPositions,
  canvasBackgroundColor = "#e8f7f0",
  isRectangleSelecting = false,
  rectangleStart,
  rectangleEnd,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onClick,
}: CanvasProps) {
  const { setNodeRef } = useDroppable({
    id: "canvas",
  })

  const dndContext = useDndContext()
  const currentDragDelta = dndContext.active?.delta
  const activeDragId = dndContext.active?.id

  const multiSelectBoundingBox = useMemo(() => {
    if (selectedItems.length <= 1) return null
    const validItems = selectedItems.filter((item) => item && typeof item.x === "number" && typeof item.y === "number")
    if (validItems.length <= 1) return null

    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY

    validItems.forEach((item) => {
      // For multi-selection, use current item positions (already updated in handleDragMove)
      minX = Math.min(minX, item.x)
      minY = Math.min(minY, item.y)
      maxX = Math.max(maxX, item.x + item.width)
      maxY = Math.max(maxY, item.y + item.height)
    })
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, [selectedItems])

  // Fixed logic for alignment guides - ensure it works for existing items
  const draggedItemForGuides = useMemo(() => {
    // For existing items being dragged
    if (isDraggingExisting && activeDragId && currentDragDelta && dragStartPositions) {
      // Handle multi-select group drag
      if (activeDragId === "multi-select-group" && multiSelectBoundingBox) {
        return {
          id: "multi-select-box",
          type: "group" as any,
          x: multiSelectBoundingBox.x,
          y: multiSelectBoundingBox.y,
          width: multiSelectBoundingBox.width,
          height: multiSelectBoundingBox.height,
          properties: {},
        }
      }

      // Handle single existing item drag - find the item being dragged
      const draggedItem = items.find((item) => item.id === activeDragId)
      if (draggedItem && dragStartPositions.has(draggedItem.id)) {
        const startPos = dragStartPositions.get(draggedItem.id)!
        return {
          ...draggedItem,
          x: startPos.x + currentDragDelta.x,
          y: startPos.y + currentDragDelta.y,
        }
      }
    }

    // For new items from library - show preview with alignment guides
    if (!isDraggingExisting && dragPreview) {
      return {
        id: "new-item-preview",
        type: activeDragId as any,
        x: dragPreview.x,
        y: dragPreview.y,
        width: dragPreview.width,
        height: dragPreview.height,
        properties: {},
      }
    }

    return null
  }, [
    isDraggingExisting,
    activeDragId,
    currentDragDelta,
    dragStartPositions,
    items,
    multiSelectBoundingBox,
    dragPreview,
  ])

  const dragPositionForGuides = useMemo(() => {
    if (draggedItemForGuides) {
      return { x: draggedItemForGuides.x, y: draggedItemForGuides.y }
    }
    return null
  }, [draggedItemForGuides])

  return (
    <div className="w-full h-full relative">
      <div
        ref={setNodeRef}
        data-canvas-droppable="true"
        className="w-full h-full relative"
        style={{ backgroundColor: canvasBackgroundColor }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onClick={onClick}
      >
        {showGrid && (
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
        )}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 border-b border-gray-200 flex items-center px-2 z-10 pointer-events-none">
          <div className="text-xs text-gray-500">Canvas: {items.length} elements</div>
          {dragPositionForGuides && (
            <div className="ml-4 text-xs text-blue-600 font-mono">
              Drag: ({Math.round(dragPositionForGuides.x)}, {Math.round(dragPositionForGuides.y)})
            </div>
          )}
          {selectedItems.length === 1 && !activeId && selectedItems[0] && (
            <div className="ml-4 text-xs text-purple-600 font-mono">
              Selected: ({Math.round(selectedItems[0].x)}, {Math.round(selectedItems[0].y)})
            </div>
          )}
          {selectedItems.length > 1 && multiSelectBoundingBox && !activeId && (
            <div className="ml-4 text-xs text-purple-600 font-mono">
              Group: ({Math.round(multiSelectBoundingBox.x)}, {Math.round(multiSelectBoundingBox.y)}) W:{" "}
              {Math.round(multiSelectBoundingBox.width)} H: {Math.round(multiSelectBoundingBox.height)}
            </div>
          )}
        </div>

        {/* Show alignment guides for both existing and new items */}
        {draggedItemForGuides && (
          <AlignmentGuides
            items={items.filter(
              (it) => it.id !== draggedItemForGuides.id && !selectedItems.find((si) => si.id === it.id),
            )}
            draggedItem={draggedItemForGuides}
            dragPosition={dragPositionForGuides!}
          />
        )}

        {isRectangleSelecting && rectangleStart && rectangleEnd && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 opacity-30 pointer-events-none z-40"
            style={{
              left: Math.min(rectangleStart.x, rectangleEnd.x),
              top: Math.min(rectangleStart.y, rectangleEnd.y),
              width: Math.abs(rectangleEnd.x - rectangleStart.x),
              height: Math.abs(rectangleEnd.y - rectangleStart.y),
            }}
          />
        )}

        {multiSelectBoundingBox && !isDraggingExisting && (
          <MultiSelectDraggable boundingBox={multiSelectBoundingBox} selectedItems={selectedItems} />
        )}

        <div className="pt-6">
          {items.map((item) => (
            <CanvasElement
              key={item.id}
              item={item}
              isSelected={selectedItems.some((si) => si.id === item.id)}
              onSelect={(ctrlKey) => onSelectItem(item, ctrlKey)}
              onUpdate={(properties) => onUpdateItem(item.id, properties)}
              onDelete={() => onDeleteItem()}
              isMultiSelected={selectedItems.length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
