import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const initialState = {
  id: "canvas-1",
  name: "My Canvas",
  createdAt: new Date().toISOString(), // Reset createdAt time as well
  updatedAt: new Date().toISOString(),
  items: [],
}

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "canvas-data.json")

    // Ghi đè file với trạng thái ban đầu
    fs.writeFileSync(filePath, JSON.stringify(initialState, null, 2), "utf8")

    // Trả về trạng thái mới để client có thể cập nhật UI
    return NextResponse.json({ message: "Canvas reset successfully.", data: initialState }, { status: 200 })
  } catch (error) {
    console.error("API Error - Error resetting canvas:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: "Error resetting canvas file", error: errorMessage }, { status: 500 })
  }
}
