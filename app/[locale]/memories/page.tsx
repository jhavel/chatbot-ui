"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getMemoriesByUserId } from "../../../db/memories"

export default function MemoryPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadMemories = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const mems = await getMemoriesByUserId(user.id)
      setMemories(mems)
      setLoading(false)
    }
    loadMemories()
  }, [supabase])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Memories</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {memories.map(mem => (
            <li key={mem.id} className="rounded bg-gray-100 p-3 shadow">
              <p className="text-sm text-gray-600">
                {new Date(mem.created_at).toLocaleString()}
              </p>
              <p>{mem.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
