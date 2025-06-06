import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ".md"]
const IGNORED_FOLDERS = ["node_modules", ".next", ".git", "public"]

export async function POST() {
  const baseDir = path.resolve(process.cwd())

  const walk = (dir: string): string[] => {
    return fs.readdirSync(dir).flatMap(file => {
      const fullPath = path.join(dir, file)
      const isDir = fs.statSync(fullPath).isDirectory()
      const isIgnored = IGNORED_FOLDERS.some(ignored =>
        fullPath.includes(path.join(baseDir, ignored))
      )

      if (isIgnored) return []
      if (isDir) return walk(fullPath)

      return ALLOWED_EXTENSIONS.includes(path.extname(fullPath))
        ? [fullPath]
        : []
    })
  }

  const files = walk(baseDir).map(f => path.relative(baseDir, f))
  return NextResponse.json({ success: true, files })
}
