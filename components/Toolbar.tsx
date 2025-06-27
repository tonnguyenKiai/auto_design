"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Save, Copy, Undo, Redo, Upload, FileJson, Folder } from "lucide-react"
import { useRef } from "react"

interface ToolbarProps {
  onSave?: () => void
  onLoad?: () => void
  onExport?: () => void
  onImport?: (file: File) => void
  onLoadSample?: () => void
}

export function Toolbar({ onSave, onLoad, onExport, onImport, onLoadSample }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    // Reset input để có thể import cùng file nhiều lần
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">E</span>
          </div>
          <span className="font-semibold text-gray-800">Canvas Editor</span>
        </div>

        <div className="ml-8 flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Load Sample Data */}
        <Button variant="outline" size="sm" onClick={onLoadSample}>
          <Folder className="w-4 h-4 mr-2" />
          Load Sample
        </Button>

        {/* Import JSON */}
        <Button variant="outline" size="sm" onClick={handleImportClick}>
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

        {/* Export JSON */}
        <Button variant="outline" size="sm" onClick={onExport}>
          <FileJson className="w-4 h-4 mr-2" />
          Export JSON
        </Button>

        <Button variant="outline" size="sm" onClick={onLoad}>
          <Copy className="w-4 h-4 mr-2" />
          Load
        </Button>

        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  )
}
