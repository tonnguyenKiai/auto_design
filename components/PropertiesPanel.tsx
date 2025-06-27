"use client"
import type { CanvasItem } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Bold, Italic, Underline, Plus, Minus } from "lucide-react"
import { TablePropertiesPanel } from "./TablePropertiesPanel"

interface PropertiesPanelProps {
  selectedItems: CanvasItem[]
  onUpdateProperties: (properties: any) => void
  tabType: "design" | "content"
}

const fontFamilies = ["Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana", "Courier New"]
const colors = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#cccccc",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#88ff00",
  "#0088ff",
  "#8800ff",
  "#ff0088",
  "#00ff88",
  "#22c55e",
]

export function PropertiesPanel({ selectedItems, onUpdateProperties, tabType }: PropertiesPanelProps) {
  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-2xl mb-2">⚙️</div>
          <p>Select element(s) to edit properties</p>
        </div>
      </div>
    )
  }

  if (selectedItems.length > 1) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-2xl mb-2">📦</div>
          <p>{selectedItems.length} items selected</p>
          <p className="text-sm mt-2">Multi-selection editing coming soon</p>
        </div>
      </div>
    )
  }

  const selectedItem = selectedItems[0]

  // Helper functions for text formatting
  const toggleBold = () => {
    const currentWeight = selectedItem.properties.fontWeight
    const newWeight = currentWeight === "bold" ? "normal" : "bold"
    onUpdateProperties({ fontWeight: newWeight })
  }

  const toggleItalic = () => {
    const currentStyle = selectedItem.properties.fontStyle
    const newStyle = currentStyle === "italic" ? "normal" : "italic"
    onUpdateProperties({ fontStyle: newStyle })
  }

  const toggleUnderline = () => {
    const currentDecoration = selectedItem.properties.textDecoration
    const newDecoration = currentDecoration === "underline" ? "none" : "underline"
    onUpdateProperties({ textDecoration: newDecoration })
  }

  // Check if text formatting is applicable
  const isTextFormattingApplicable = ["text", "button", "label", "checkbox", "radio", "fieldset"].includes(
    selectedItem.type,
  )

  // Tab management for tabbar
  const addTab = () => {
    const currentTabs = selectedItem.properties.tabs || ["Tab 1", "Tab 2", "Tab 3"]
    const newTabs = [...currentTabs, `Tab ${currentTabs.length + 1}`]
    onUpdateProperties({ tabs: newTabs })
  }

  const removeTab = () => {
    const currentTabs = selectedItem.properties.tabs || ["Tab 1", "Tab 2", "Tab 3"]
    if (currentTabs.length > 1) {
      const newTabs = currentTabs.slice(0, -1)
      const activeTab = selectedItem.properties.activeTab || 0
      onUpdateProperties({
        tabs: newTabs,
        activeTab: activeTab >= newTabs.length ? newTabs.length - 1 : activeTab,
      })
    }
  }

  const updateTab = (index: number, value: string) => {
    const currentTabs = selectedItem.properties.tabs || ["Tab 1", "Tab 2", "Tab 3"]
    const newTabs = [...currentTabs]
    newTabs[index] = value
    onUpdateProperties({ tabs: newTabs })
  }

  // Render Design Tab Content
  if (tabType === "design") {
    return (
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Design Properties</h3>

        <div>
          <Label className="text-figma-text-medium">Canvas Background</Label>
          <div className="grid grid-cols-8 gap-1 mt-1">
            {["#e8f7f0", "#ffffff", "#f0f0f0", "#f5f5f5", "#e0e0e0", "#d0d0d0", "#c0c0c0", "#a0a0a0"].map((color) => (
              <button
                key={`canvas-${color}`}
                className={`w-6 h-6 rounded border hover:ring-1 hover:ring-offset-1 hover:ring-figma-button-green ${
                  // You'll need to pass canvasBackgroundColor as a prop to check selection
                  color === "#e8f7f0" ? "ring-2 ring-offset-1 ring-figma-button-green" : "border-figma-border-gray"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  // You'll need to pass an onUpdateCanvasBackground callback prop
                  // onUpdateCanvasBackground(color)
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Font Family */}
        {isTextFormattingApplicable && (
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={selectedItem.properties.fontFamily || "Arial"}
              onValueChange={(value) => onUpdateProperties({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Font Size */}
        {isTextFormattingApplicable && (
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Input
              type="number"
              value={selectedItem.properties.fontSize || 14}
              onChange={(e) => onUpdateProperties({ fontSize: Number.parseInt(e.target.value) })}
            />
          </div>
        )}

        {/* Text Formatting - Only show for applicable types */}
        {isTextFormattingApplicable && (
          <div className="space-y-2">
            <Label>Text Format</Label>
            <div className="flex space-x-1">
              <Button
                variant={selectedItem.properties.fontWeight === "bold" ? "default" : "outline"}
                size="sm"
                onClick={toggleBold}
                className={selectedItem.properties.fontWeight === "bold" ? "bg-blue-600 text-white" : ""}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedItem.properties.fontStyle === "italic" ? "default" : "outline"}
                size="sm"
                onClick={toggleItalic}
                className={selectedItem.properties.fontStyle === "italic" ? "bg-blue-600 text-white" : ""}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedItem.properties.textDecoration === "underline" ? "default" : "outline"}
                size="sm"
                onClick={toggleUnderline}
                className={selectedItem.properties.textDecoration === "underline" ? "bg-blue-600 text-white" : ""}
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Text Alignment - Only for text, button, and label */}
        {(selectedItem.type === "text" || selectedItem.type === "button" || selectedItem.type === "label") && (
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <Select
              value={selectedItem.properties.textAlign || "left"}
              onValueChange={(value) => onUpdateProperties({ textAlign: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="grid grid-cols-6 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded border-2 hover:border-gray-400 ${
                  selectedItem.properties.color === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onUpdateProperties({ color })}
              />
            ))}
          </div>
        </div>

        {/* Input Text Color - Only for input */}
        {selectedItem.type === "input" && (
          <div className="space-y-2">
            <Label>Input Text Color</Label>
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 hover:border-gray-400 ${
                    selectedItem.properties.textColor === color
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateProperties({ textColor: color })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Background Color */}
        {!["checkbox", "radio"].includes(selectedItem.type) && (
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 hover:border-gray-400 ${
                    selectedItem.properties.backgroundColor === color
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateProperties({ backgroundColor: color })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Border Radius */}
        {!["text", "checkbox", "radio", "fieldset"].includes(selectedItem.type) && (
          <div className="space-y-2">
            <Label>Border Radius</Label>
            <Input
              type="number"
              value={selectedItem.properties.borderRadius || 0}
              onChange={(e) => onUpdateProperties({ borderRadius: Number.parseInt(e.target.value) })}
            />
          </div>
        )}
      </div>
    )
  }

  // Render Content Tab Content
  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Content Properties</h3>

      {/* Text Content */}
      {(selectedItem.type === "text" || selectedItem.type === "button" || selectedItem.type === "label") && (
        <div className="space-y-2">
          <Label>Text</Label>
          <Input
            value={selectedItem.properties.text || ""}
            onChange={(e) => onUpdateProperties({ text: e.target.value })}
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Input/Textarea/Search Placeholder */}
      {(selectedItem.type === "input" || selectedItem.type === "textarea") && (
        <>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={selectedItem.properties.placeholder || ""}
              onChange={(e) => onUpdateProperties({ placeholder: e.target.value })}
              placeholder="Enter placeholder..."
              className="h-7 text-xs border-figma-input-border bg-figma-white mt-1"
            />
          </div>
          {selectedItem.type === "input" && (
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                value={selectedItem.properties.value || ""}
                onChange={(e) => onUpdateProperties({ value: e.target.value })}
                placeholder="Enter value..."
                className="h-7 text-xs border-figma-input-border bg-figma-white mt-1"
              />
            </div>
          )}
          {selectedItem.type === "input" && (
            <div className="flex items-center space-x-2 mt-1.5">
              <Checkbox
                id={`prop-readonly-${selectedItem.id}`}
                checked={selectedItem.properties.readonly || false}
                onCheckedChange={(checked) => onUpdateProperties({ readonly: checked })}
                className="data-[state=checked]:bg-figma-button-green data-[state=checked]:border-figma-button-green"
              />
              <Label htmlFor={`prop-readonly-${selectedItem.id}`} className="text-figma-text-medium">
                Read Only
              </Label>
            </div>
          )}
        </>
      )}

      {/* Checkbox Properties */}
      {selectedItem.type === "checkbox" && (
        <>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={selectedItem.properties.label || ""}
              onChange={(e) => onUpdateProperties({ label: e.target.value })}
              placeholder="Enter label (leave empty for checkbox only)"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedItem.properties.checked || false}
                onCheckedChange={(checked) => onUpdateProperties({ checked })}
              />
              <Label>Checked</Label>
            </div>
          </div>
        </>
      )}

      {/* Radio Properties */}
      {selectedItem.type === "radio" && (
        <>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={selectedItem.properties.label || ""}
              onChange={(e) => onUpdateProperties({ label: e.target.value })}
              placeholder="Enter label (leave empty for radio only)"
            />
          </div>
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              value={selectedItem.properties.name || ""}
              onChange={(e) => onUpdateProperties({ name: e.target.value })}
              placeholder="radioGroup"
            />
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={selectedItem.properties.value || ""}
              onChange={(e) => onUpdateProperties({ value: e.target.value })}
              placeholder="option1"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedItem.properties.checked || false}
                onCheckedChange={(checked) => onUpdateProperties({ checked })}
              />
              <Label>Selected</Label>
            </div>
          </div>
        </>
      )}

      {/* Textarea Rows */}
      {selectedItem.type === "textarea" && (
        <div className="space-y-2">
          <Label>Rows</Label>
          <Input
            type="number"
            value={selectedItem.properties.rows || 4}
            onChange={(e) => onUpdateProperties({ rows: Number.parseInt(e.target.value) })}
            min="1"
          />
        </div>
      )}

      {/* Tab Bar Management */}
      {selectedItem.type === "tabbar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Tabs</Label>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" onClick={addTab}>
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeTab}
                disabled={(selectedItem.properties.tabs || []).length <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {(selectedItem.properties.tabs || ["Tab 1", "Tab 2", "Tab 3"]).map((tab: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={tab}
                  onChange={(e) => updateTab(index, e.target.value)}
                  placeholder={`Tab ${index + 1}`}
                  className="flex-1"
                />
                <Checkbox
                  checked={(selectedItem.properties.activeTab || 0) === index}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdateProperties({ activeTab: index })
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fieldset Properties */}
      {selectedItem.type === "fieldset" && (
        <div className="space-y-2">
          <Label>Legend</Label>
          <Input
            value={selectedItem.properties.legend || ""}
            onChange={(e) => onUpdateProperties({ legend: e.target.value })}
            placeholder="Field Set"
          />
        </div>
      )}

      {/* Search Button Text */}
      {selectedItem.type === "searchbutton" && (
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={selectedItem.properties.text || ""}
            onChange={(e) => onUpdateProperties({ text: e.target.value })}
            placeholder="Search"
          />
        </div>
      )}

      {/* Table Properties */}
      {selectedItem.type === "table" && (
        <>
          <div className="space-y-2">
            <Label>Rows</Label>
            <Input
              type="number"
              value={selectedItem.properties.rows || 3}
              onChange={(e) => onUpdateProperties({ rows: Number.parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            <Input
              type="number"
              value={selectedItem.properties.columns || 3}
              onChange={(e) => onUpdateProperties({ columns: Number.parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <TablePropertiesPanel item={selectedItem} onUpdateProperties={onUpdateProperties} />
        </>
      )}

      {/* Select Options */}
      {selectedItem.type === "select" && (
        <div className="space-y-2">
          <Label>Options (one per line)</Label>
          <textarea
            value={(selectedItem.properties.options || []).join("\n")}
            onChange={(e) => onUpdateProperties({ options: e.target.value.split("\n").filter((opt) => opt.trim()) })}
            placeholder="Option 1\nOption 2\nOption 3"
            className="w-full h-20 p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )}
    </div>
  )
}
