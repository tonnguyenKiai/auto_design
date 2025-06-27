import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { CanvasData } from "@/lib/canvas-storage" // Đảm bảo CanvasData được export từ lib

export async function POST(request: Request) {
  try {
    console.log("[API /api/save-canvas] Received POST request.")
    const canvasData: CanvasData = await request.json()
    console.log("[API /api/save-canvas] Parsed canvasData from request:", JSON.stringify(canvasData, null, 2))

    if (!canvasData || !canvasData.id || !Array.isArray(canvasData.items)) {
      return NextResponse.json({ message: "Invalid canvas data provided" }, { status: 400 })
    }

    // Cập nhật thời gian updatedAt trước khi lưu
    const dataToSave: CanvasData = {
      ...canvasData,
      updatedAt: new Date().toISOString(),
    }

    const filePath = path.join(process.cwd(), "public", "data", "canvas-data.json")

    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    console.log("[API /api/save-canvas] Attempting to write to filePath:", filePath)
    console.log("[API /api/save-canvas] Data to write:", JSON.stringify(dataToSave, null, 2))

    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), "utf8")

    console.log("[API /api/save-canvas] Successfully wrote to file:", filePath)

    return NextResponse.json({ message: "Canvas data saved successfully to server file." }, { status: 200 })
  } catch (error) {
    console.error("[API /api/save-canvas] Error during file operation or processing:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { message: "Error saving canvas data to server file", error: errorMessage },
      { status: 500 },
    )
  }
}
