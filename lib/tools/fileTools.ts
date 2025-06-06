export const fileTools = [
  {
    name: "list_files",
    description: "List all editable source files in the codebase",
    parameters: {
      type: "object",
      properties: {}
    },
    function: async () => {
      const res = await fetch("/api/assistant/files/list", {
        method: "POST"
      })
      const data = await res.json()
      return data.files
    }
  },
  {
    name: "read_file",
    description: "Read the content of a specific source file",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The relative path to the file"
        }
      },
      required: ["filePath"]
    },
    function: async ({ filePath }: { filePath: string }) => {
      const res = await fetch("/api/assistant/files/read", {
        method: "POST",
        body: JSON.stringify({ filePath }),
        headers: { "Content-Type": "application/json" }
      })
      const data = await res.json()
      return data.content
    }
  },
  {
    name: "edit_file",
    description: "Edit a file by replacing matching text using a regex pattern",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file to modify" },
        operation: { type: "string", enum: ["replace"] },
        pattern: { type: "string", description: "Regex pattern to match" },
        replacement: { type: "string", description: "Replacement text" }
      },
      required: ["path", "operation", "pattern", "replacement"]
    },
    function: async ({
      path,
      operation,
      pattern,
      replacement
    }: {
      path: string
      operation: "replace"
      pattern: string
      replacement: string
    }) => {
      const res = await fetch("/api/assistant/files/edit", {
        method: "POST",
        body: JSON.stringify({ path, operation, pattern, replacement }),
        headers: { "Content-Type": "application/json" }
      })
      return await res.json()
    }
  }
]
