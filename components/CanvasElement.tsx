"use client"

import type React from "react"
import { useDraggable } from "@dnd-kit/core"
import { useState, useRef, useCallback, useEffect } from "react"
import type { CanvasItem } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, MessageSquare } from "lucide-react"

interface CanvasElementProps {
  item: CanvasItem
  isSelected: boolean
  onSelect: (ctrlKey: boolean) => void
  onUpdate: (properties: any) => void
  onDelete: () => void
  isMultiSelected?: boolean
}

const isTextEditableType = (type: CanvasItem["type"]) => {
  return ["text", "button", "label", "input", "textarea", "searchbutton", "checkbox", "radio", "fieldset"].includes(
    type,
  )
}

export function CanvasElement({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isMultiSelected = false,
}: CanvasElementProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)
  const [editText, setEditText] = useState("")

  const [isCommenting, setIsCommenting] = useState(false)
  const [commentText, setCommentText] = useState("")
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const commentWrapperRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: {
      type: "canvas-item",
    },
    disabled: isEditingText || isResizing || isCommenting,
  })

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingText])

  useEffect(() => {
    if (isCommenting && commentTextareaRef.current) {
      commentTextareaRef.current.focus()
      setCommentText(item.properties.comment || "") // Load current comment when opening
    }
  }, [isCommenting, item.properties.comment])

  const handleSaveComment = useCallback(() => {
    // Only update if the comment text has actually changed or if it's a new comment
    if (commentText !== (item.properties.comment || "") || (commentText && !item.properties.comment)) {
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

    document.addEventListener("mousedown", handleClickOutsideCommentBox)
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideCommentBox)
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

    let currentText = ""
    switch (item.type) {
      case "text":
        currentText = item.properties.text || "Sample Text"
        break
      case "button":
        currentText = item.properties.text || "Button"
        break
      case "label":
        currentText = item.properties.text || "品名入力"
        break
      case "input":
        currentText = item.properties.value || ""
        break
      case "textarea":
        currentText = item.properties.placeholder || "Enter your message..."
        break
      case "searchbutton":
        currentText = item.properties.text || "Search"
        break
      case "checkbox":
        currentText = item.properties.label || "Checkbox Label"
        break
      case "radio":
        currentText = item.properties.label || "Radio Option"
        break
      case "fieldset":
        currentText = item.properties.legend || "Field Set"
        break
      default:
        currentText = ""
    }
    setEditText(currentText)
    setIsEditingText(true)
  }, [item.type, item.properties, isCommenting])

  const handleTextEditSave = useCallback(() => {
    if (!isTextEditableType(item.type)) return

    let propToUpdate: string
    if (item.type === "input") {
      propToUpdate = "value"
    } else if (item.type === "textarea") {
      propToUpdate = "placeholder"
    } else if (item.type === "checkbox" || item.type === "radio") {
      propToUpdate = "label"
    } else if (item.type === "fieldset") {
      propToUpdate = "legend"
    } else {
      propToUpdate = "text"
    }

    onUpdate({ [propToUpdate]: editText })
    setIsEditingText(false)
  }, [editText, onUpdate, item.type])

  const handleTextEditCancel = useCallback(() => {
    setIsEditingText(false)
  }, [])

  const handleElementClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        isResizing ||
        (e.target as HTMLElement).closest('[data-control-element="true"]') ||
        (e.target as HTMLElement).closest(".comment-textarea-wrapper")
      ) {
        return
      }

      if (isCommenting) {
        return
      }

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

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (item.type === "checkbox") onUpdate({ checked: !item.properties.checked })
      else if (item.type === "radio") onUpdate({ checked: !item.properties.checked })
    },
    [item.type, item.properties.checked, onUpdate],
  )

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
      document.body.style.cursor = "se-resize"
      document.body.style.userSelect = "none"
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleResizeEnd)
      if (document.body.style.cursor === "se-resize") document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const handleCommentIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditingText) setIsEditingText(false) // Close text edit if open

    if (isCommenting) {
      // If already commenting, clicking icon again might mean save or just toggle
      handleSaveComment() // Let's assume clicking icon again saves and closes
    } else {
      setCommentText(item.properties.comment || "")
      setIsCommenting(true)
    }
  }

  const renderElement = () => {
    const style = {
      fontSize: item.properties.fontSize || 14,
      fontFamily: item.properties.fontFamily || "Arial",
      color: item.properties.color || "#000000",
      backgroundColor: item.properties.backgroundColor,
      borderRadius: item.properties.borderRadius || 0,
      padding: item.properties.padding || 0,
      fontWeight: item.properties.fontWeight || "normal",
      fontStyle: item.properties.fontStyle || "normal",
      textDecoration: item.properties.textDecoration || "none",
      textAlign: item.properties.textAlign || "left",
    }

    if (isEditingText && isTextEditableType(item.type)) {
      const commonInputProps = {
        value: editText,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditText(e.target.value),
        onBlur: handleTextEditSave, // Text input blur saves text edit
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" && item.type !== "textarea") handleTextEditSave()
          else if (e.key === "Escape") handleTextEditCancel()
        },
        className: "w-full h-full bg-transparent border border-blue-500 outline-none rounded px-2",
        style: { ...style, cursor: "text" },
        autoFocus: true,
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        ref: inputRef as React.RefObject<any>,
      }
      if (item.type === "textarea")
        return (
          <textarea
            {...commonInputProps}
            rows={item.properties.rows || 4}
            placeholder={item.properties.placeholder || "Enter your message..."}
            className="w-full h-full bg-white border-2 border-blue-500 outline-none rounded p-2 resize-none"
          />
        )
      return (
        <div className="w-full h-full flex items-center justify-center">
          <input
            type="text"
            {...commonInputProps}
            value={editText}
            placeholder={item.properties.placeholder || "Enter text..."}
          />
        </div>
      )
    }

    switch (item.type) {
      case "text":
        return (
          <div
            style={style}
            className="w-full h-full flex items-center justify-center pointer-events-none select-none px-1"
          >
            {item.properties.text || "Sample Text"}
          </div>
        )
      case "label":
        return (
          <div style={style} className="w-full h-full flex items-center justify-center pointer-events-none select-none">
            {item.properties.text || "品名入力"}
          </div>
        )
      case "button":
        return (
          <button
            style={{
              ...style,
              backgroundColor: item.properties.backgroundColor || "#f0f0f0",
              borderWidth: item.properties.borderWidth || 2,
              borderColor: item.properties.borderColor || "#d4d0c8",
              borderStyle: item.properties.borderStyle || "outset",
              borderRadius: item.properties.borderRadius || 0,
              padding: item.properties.padding || 4,
              fontFamily: "MS Gothic",
              boxSizing: "border-box",
            }}
            className="w-full h-full pointer-events-none text-xs"
          >
            {item.properties.text || "Button"}
          </button>
        )
      case "input":
        const inputBgColor = item.properties.readonly ? "#f0fae6" : item.properties.backgroundColor || "#ffffff"
        const inputBorderColor = item.properties.readonly ? "#e8f7f0" : item.properties.borderColor || "#000000"
        const inputTextColor = item.properties.textColor || "#000000" // Add textColor property

        return (
          <input
            style={{
              ...style,
              color: inputTextColor, // Use textColor for input text
              backgroundColor: inputBgColor,
              borderWidth: item.properties.borderWidth || 1,
              borderColor: inputBorderColor,
              borderStyle: item.properties.borderStyle || "solid",
              borderRadius: item.properties.borderRadius || 0,
              padding: item.properties.padding || 2,
              fontFamily: "MS Gothic",
              boxSizing: "border-box",
            }}
            value={item.properties.value || ""}
            placeholder={item.properties.placeholder || "Enter text..."}
            className="w-full h-full pointer-events-none text-xs"
            readOnly // Keep this for display mode
          />
        )
      case "checkbox":
        const checkboxLabelBg = item.properties.checked
          ? item.properties.checkedBackgroundColor || "#00FFFF"
          : "transparent"

        if (!item.properties.label || item.properties.label.trim() === "")
          return (
            <div className="w-full h-full flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.properties.checked || false}
                onClick={handleCheckboxClick}
                className="cursor-pointer"
                style={{ transform: "scale(0.8)" }}
                onMouseDown={(e) => e.stopPropagation()}
                readOnly
              />
            </div>
          )
        return (
          <div className="w-full h-full flex items-center space-x-1">
            <input
              type="checkbox"
              checked={item.properties.checked || false}
              onClick={handleCheckboxClick}
              className="cursor-pointer"
              style={{ transform: "scale(0.8)" }}
              onMouseDown={(e) => e.stopPropagation()}
              readOnly
            />
            <label
              style={{
                fontSize: item.properties.fontSize || 13,
                fontFamily: "MS Gothic",
                color: item.properties.color || "#000000",
                backgroundColor: checkboxLabelBg,
                padding: checkboxLabelBg !== "transparent" ? "1px 3px" : "0",
              }}
              className="select-none pointer-events-none text-xs"
            >
              {item.properties.label}
            </label>
          </div>
        )
      case "radio":
        const radioLabelBg = item.properties.checked
          ? item.properties.checkedBackgroundColor || "#00FFFF"
          : "transparent"

        if (!item.properties.label || item.properties.label.trim() === "")
          return (
            <div className="w-full h-full flex items-center justify-center">
              <input
                type="radio"
                name={item.properties.name || "radioGroup"}
                value={item.properties.value || "option1"}
                checked={item.properties.checked || false}
                onClick={handleCheckboxClick}
                className="cursor-pointer"
                style={{ transform: "scale(0.8)" }}
                readOnly
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          )
        return (
          <div className="w-full h-full flex items-center space-x-1">
            <input
              type="radio"
              name={item.properties.name || "radioGroup"}
              value={item.properties.value || "option1"}
              checked={item.properties.checked || false}
              onClick={handleCheckboxClick}
              className="cursor-pointer"
              style={{ transform: "scale(0.8)" }}
              readOnly
              onMouseDown={(e) => e.stopPropagation()}
            />
            <label
              style={{
                fontSize: item.properties.fontSize || 13,
                fontFamily: "MS Gothic",
                color: item.properties.color || "#000000",
                backgroundColor: radioLabelBg,
                padding: radioLabelBg !== "transparent" ? "1px 3px" : "0",
              }}
              className="select-none pointer-events-none text-xs"
            >
              {item.properties.label}
            </label>
          </div>
        )
      case "textarea":
        return (
          <Textarea
            style={style}
            placeholder={item.properties.placeholder || "Enter your message..."}
            rows={item.properties.rows || 4}
            className="w-full h-full pointer-events-none resize-none"
            readOnly
          />
        )
      case "tabbar":
        return (
          <div className="w-full h-full pointer-events-none" style={{ fontFamily: "MS Gothic" }}>
            <div className="flex border-b" style={{ borderColor: item.properties.borderColor || "#d4d0c8" }}>
              {(item.properties.tabs || ["Tab 1", "Tab 2", "Tab 3"]).map((tab: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-1 text-xs border-r border-t"
                  style={{
                    backgroundColor:
                      (item.properties.activeTab || 0) === index
                        ? "#ffffff"
                        : item.properties.backgroundColor || "#f0f0f0",
                    borderColor: item.properties.borderColor || "#d4d0c8",
                    color: item.properties.activeColor || "#000000",
                    fontFamily: "MS Gothic",
                    fontSize: item.properties.fontSize || 13,
                    borderTopLeftRadius: index === 0 ? "3px" : "0",
                    borderTopRightRadius: index === (item.properties.tabs || []).length - 1 ? "3px" : "0",
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>
        )
      case "fieldset":
        return (
          <fieldset
            className="w-full h-full border-2 border-gray-300 rounded p-2 pointer-events-none"
            style={{ borderColor: item.properties.borderColor || "#dee2e6" }}
          >
            <legend style={style} className="px-2 select-none">
              {item.properties.legend || "Field Set"}
            </legend>
            <div className="text-xs text-gray-400 mt-2 select-none">Content area</div>
          </fieldset>
        )
      case "searchbutton":
        return (
          <button
            style={{
              backgroundColor: item.properties.backgroundColor || "#f0f0f0",
              borderWidth: item.properties.borderWidth || 2,
              borderColor: item.properties.borderColor || "#d4d0c8",
              borderStyle: item.properties.borderStyle || "outset",
              borderRadius: item.properties.borderRadius || 0,
              backgroundImage: "url('/images/search-button.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
            className="w-full h-full pointer-events-none"
            title="Search"
          />
        )
      case "table":
        return (
          <div
            style={style}
            className="w-full h-full border border-gray-300 overflow-auto pointer-events-none relative"
          >
            <table className="w-full text-xs border-collapse">
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
                          ? item.properties.headerBackgroundColor || "#1d4d35"
                          : customRowBg || item.properties.backgroundColor || "#f5f5f5",
                        height: rowHeight,
                      }}
                    >
                      {Array.from({ length: item.properties.columns || 10 }).map((_, colIndex) => {
                        const cellKey = `${rowIndex}-${colIndex}`
                        const cellValue = item.properties.cellData?.[cellKey] || ""
                        const isCheckboxColumn = item.properties.columnTypes?.[colIndex.toString()] === "checkbox"
                        const customColBg = item.properties.columnBackgrounds?.[colIndex.toString()]
                        const columnWidth = item.properties.columnWidths?.[colIndex.toString()] || 80

                        return (
                          <td
                            key={colIndex}
                            className="border border-gray-300 p-1 relative"
                            style={{
                              width: columnWidth,
                              minWidth: columnWidth,
                              maxWidth: columnWidth,
                              height: rowHeight,
                              color: isHeaderRow
                                ? item.properties.headerColor || "#ffffff"
                                : item.properties.color || "#000000",
                              fontWeight: isHeaderRow ? item.properties.headerFontWeight || "bold" : "normal",
                              backgroundColor: customColBg || "inherit",
                              position: "relative",
                            }}
                          >
                            {isCheckboxColumn && !isHeaderRow ? (
                              <div className="flex items-center justify-center h-full">
                                <input
                                  type="checkbox"
                                  checked={cellValue === "✓"}
                                  onChange={(e) => {
                                    const newCellData = { ...item.properties.cellData }
                                    newCellData[cellKey] = e.target.checked ? "✓" : ""
                                    onUpdate({ cellData: newCellData })
                                  }}
                                  className="cursor-pointer"
                                  style={{ transform: "scale(0.8)" }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => {
                                  const newCellData = { ...item.properties.cellData }
                                  if (e.target.value === "") delete newCellData[cellKey]
                                  else newCellData[cellKey] = e.target.value
                                  onUpdate({ cellData: newCellData })
                                }}
                                placeholder={isHeaderRow ? "" : ""}
                                className="w-full h-full bg-transparent border-none outline-none resize-none text-xs p-1 focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 rounded pointer-events-auto"
                                style={{
                                  fontSize: item.properties.fontSize || 11,
                                  fontFamily: item.properties.fontFamily || "MS Gothic",
                                  color: isHeaderRow
                                    ? item.properties.headerColor || "#ffffff"
                                    : item.properties.color || "#000000",
                                  fontWeight: isHeaderRow ? item.properties.headerFontWeight || "bold" : "normal",
                                  minHeight: rowHeight - 2,
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
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
      case "select":
        return (
          <Select>
            <SelectTrigger style={style} className="w-full h-full pointer-events-none">
              <SelectValue placeholder="Select option..." />
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
    cursor: !isEditingText && !isResizing && !isDragging && !isCommenting ? "pointer" : undefined,
  }

  // Calculate text bounds for tight border on text elements
  const getTextBounds = () => {
    if (item.type === "text" && item.properties.text) {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (context) {
        context.font = `${item.properties.fontSize || 14}px ${item.properties.fontFamily || "Arial"}`
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

  const textBounds = item.type === "text" && isSelected ? getTextBounds() : null

  return (
    <div
      ref={setNodeRef}
      style={elementStyle}
      className={`absolute select-none
      ${isSelected && !isCommenting ? "border-0" : isHovered && !isCommenting ? "border border-blue-300" : "border-0"}
      ${isDragging ? "z-50 opacity-50" : "z-10"}
    `}
      onClick={handleElementClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
      data-canvas-item="true"
    >
      <div className="w-full h-full" {...listeners}>
        {renderElement()}
      </div>

      {/* Tight border for text elements */}
      {textBounds && isSelected && !isCommenting && (
        <div
          className="absolute border-2 border-blue-500 pointer-events-none"
          style={{
            left: textBounds.left,
            top: textBounds.top,
            width: textBounds.width,
            height: textBounds.height,
          }}
        />
      )}

      {/* Tight border for all other elements */}
      {isSelected && !isCommenting && !(item.type === "text" && textBounds) && (
        <div
          className="absolute border-2 border-blue-500 pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: item.width,
            height: item.height,
          }}
        />
      )}

      {/* Control icons positioned at top center - smaller size */}
      {isSelected && !isDragging && !isResizing && !isCommenting && !isMultiSelected && (
        <>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white border border-gray-300 rounded px-1 py-0.5 shadow-sm z-20">
            <Button
              data-control-element="true"
              data-comment-icon-for={item.id}
              size="sm"
              variant="ghost"
              className="w-4 h-4 p-0 hover:bg-gray-100"
              onClick={handleCommentIconClick}
              onMouseDown={(e) => e.stopPropagation()}
              title="Add/View comment"
            >
              <MessageSquare className="w-2 h-2 text-gray-600" />
            </Button>
            <Button
              data-control-element="true"
              size="sm"
              variant="ghost"
              className="w-4 h-4 p-0 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Delete item"
            >
              <Trash2 className="w-2 h-2 text-red-600" />
            </Button>
          </div>
          <div
            data-control-element="true"
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize hover:bg-blue-600 rounded-sm z-20"
            style={
              textBounds
                ? {
                    left: textBounds.left + textBounds.width - 8,
                    top: textBounds.top + textBounds.height - 8,
                  }
                : { bottom: "-0.5rem", right: "-0.5rem" }
            }
            onMouseDown={(e) => {
              e.stopPropagation()
              handleResizeStart(e)
            }}
            title="Resize item"
          />
          {/* Decorative corner dots - only show if not text with tight border */}
          {!(item.type === "text" && textBounds) && (
            <>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none" />
            </>
          )}
        </>
      )}

      {isSelected && isCommenting && (
        <div
          ref={commentWrapperRef}
          className="comment-textarea-wrapper absolute top-full left-0 mt-2 w-[250px] bg-white p-3 rounded-lg shadow-xl z-30 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Textarea
            ref={commentTextareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onBlur={handleCommentTextareaBlur} // Save on blur
            rows={3}
            className="w-full mb-2 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your comment..."
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancelComment} className="text-xs bg-transparent">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveComment} className="text-xs bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
