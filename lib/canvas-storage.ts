import type { CanvasItem } from "@/app/page"

export interface CanvasData {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: CanvasItem[]
}

// Lưu canvas data vào localStorage
export const saveCanvasToStorage = (canvasData: CanvasData): void => {
  try {
    localStorage.setItem(`canvas-${canvasData.id}`, JSON.stringify(canvasData))
    console.log("Canvas saved to localStorage:", canvasData.id)
  } catch (error) {
    console.error("Error saving canvas to localStorage:", error)
  }
}

// Load canvas data từ localStorage
export const loadCanvasFromStorage = (canvasId: string): CanvasData | null => {
  try {
    const data = localStorage.getItem(`canvas-${canvasId}`)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error("Error loading canvas from localStorage:", error)
    return null
  }
}

// Xóa canvas data khỏi localStorage
export const clearCanvasFromStorage = (canvasId: string): void => {
  try {
    localStorage.removeItem(`canvas-${canvasId}`)
    console.log("Canvas cleared from localStorage:", canvasId)
  } catch (error) {
    console.error("Error clearing canvas from localStorage:", error)
  }
}

// Lấy danh sách tất cả canvas đã lưu
export const getAllCanvasFromStorage = (): CanvasData[] => {
  try {
    const canvasList: CanvasData[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("canvas-")) {
        const data = localStorage.getItem(key)
        if (data) {
          canvasList.push(JSON.parse(data))
        }
      }
    }
    return canvasList
  } catch (error) {
    console.error("Error getting all canvas from localStorage:", error)
    return []
  }
}

// Xuất canvas data thành JSON file (cho chức năng Download)
export const exportCanvasToJSONFile = (canvasData: CanvasData): void => {
  try {
    const dataStr = JSON.stringify(canvasData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `canvas-${canvasData.name || canvasData.id}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    console.log("Canvas exported to JSON file for download")
  } catch (error) {
    console.error("Error exporting canvas to JSON for download:", error)
  }
}

// Import canvas data từ JSON file
export const importCanvasFromJSON = (file: File): Promise<CanvasData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result === "string") {
          const canvasData: CanvasData = JSON.parse(result)
          resolve(canvasData)
        } else {
          reject(new Error("Invalid file content"))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Error reading file"))
    reader.readAsText(file)
  })
}

// Load sample data từ file JSON (file này giờ sẽ được server cập nhật)
export const loadSampleCanvasData = async (): Promise<CanvasData | null> => {
  try {
    const response = await fetch("/data/canvas-data.json?t=" + new Date().getTime()) // Thêm cache buster

    if (!response.ok) {
      console.error("Failed to load canvas data from file, response not OK:", response.status, response.statusText)
      return null
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || contentType.indexOf("application/json") === -1) {
      console.error("Failed to load canvas data: Expected 'application/json' but received '" + contentType + "'")
      return null
    }

    const data: CanvasData = await response.json()
    return data
  } catch (error) {
    console.error("Error loading canvas data from file:", error)
    return null
  }
}
