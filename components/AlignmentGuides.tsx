"use client"

import { useMemo } from "react"
import type { CanvasItem } from "@/app/page"

interface AlignmentGuidesProps {
  items: CanvasItem[]
  draggedItem: CanvasItem | null
  dragPosition: { x: number; y: number } | null
}

const SNAP_THRESHOLD = 8

export function AlignmentGuides({ items, draggedItem, dragPosition }: AlignmentGuidesProps) {
  const guides = useMemo(() => {
    if (!draggedItem || !dragPosition) return []

    const localGuides: Array<{ type: "vertical" | "horizontal"; position: number; color: string }> = []
    const draggedRect = {
      left: dragPosition.x,
      right: dragPosition.x + draggedItem.width,
      top: dragPosition.y,
      bottom: dragPosition.y + draggedItem.height,
      centerX: dragPosition.x + draggedItem.width / 2,
      centerY: dragPosition.y + draggedItem.height / 2,
    }

    items.forEach((item) => {
      if (item.id === draggedItem.id) return

      const itemRect = {
        left: item.x,
        right: item.x + item.width,
        top: item.y,
        bottom: item.y + item.height,
        centerX: item.x + item.width / 2,
        centerY: item.y + item.height / 2,
      }

      if (Math.abs(draggedRect.left - itemRect.left) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "vertical", position: itemRect.left, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.right - itemRect.right) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "vertical", position: itemRect.right, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.centerX - itemRect.centerX) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "vertical", position: itemRect.centerX, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.left - itemRect.right) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "vertical", position: itemRect.right, color: "#10b981" })
      }
      if (Math.abs(draggedRect.right - itemRect.left) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "vertical", position: itemRect.left, color: "#10b981" })
      }
      if (Math.abs(draggedRect.top - itemRect.top) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "horizontal", position: itemRect.top, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.bottom - itemRect.bottom) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "horizontal", position: itemRect.bottom, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.centerY - itemRect.centerY) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "horizontal", position: itemRect.centerY, color: "#3b82f6" })
      }
      if (Math.abs(draggedRect.top - itemRect.bottom) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "horizontal", position: itemRect.bottom, color: "#10b981" })
      }
      if (Math.abs(draggedRect.bottom - itemRect.top) <= SNAP_THRESHOLD) {
        localGuides.push({ type: "horizontal", position: itemRect.top, color: "#10b981" })
      }
    })

    const uniqueGuides = localGuides.filter(
      (guide, index, self) => index === self.findIndex((g) => g.type === guide.type && g.position === guide.position),
    )
    return uniqueGuides
  }, [items, draggedItem, dragPosition])

  if (!guides || guides.length === 0) {
    return null
  }

  return (
    <>
      {guides.map((guide, index) => (
        <div
          key={index}
          className="absolute pointer-events-none z-30"
          style={{
            ...(guide.type === "vertical"
              ? { left: guide.position, top: 0, height: "100%", width: "1px", backgroundColor: guide.color }
              : { top: guide.position, left: 0, width: "100%", height: "1px", backgroundColor: guide.color }),
            boxShadow: `0 0 0 0.5px rgba(255, 255, 255, 0.8)`,
          }}
        />
      ))}
    </>
  )
}
