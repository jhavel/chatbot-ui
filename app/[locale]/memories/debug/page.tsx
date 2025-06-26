"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DebugResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  data?: any
}

export default function MemoryDebugPage() {
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const runTests = async () => {
    setLoading(true)
    setResults([])
    const newResults: DebugResult[] = []

    try {
      // Test 1: Authentication
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()
      if (authError || !user) {
        newResults.push({
          test: "Authentication",
          status: "error",
          message: "User not authenticated"
        })
        setResults(newResults)
        setLoading(false)
        return
      } else {
        newResults.push({
          test: "Authentication",
          status: "success",
          message: `Authenticated as ${user.email}`,
          data: { user_id: user.id }
        })
      }

      // Test 2: Basic database connection
      const { data: basicData, error: basicError } = await supabase
        .from("memories")
        .select("count")
        .limit(1)

      if (basicError) {
        newResults.push({
          test: "Database Connection",
          status: "error",
          message: basicError.message
        })
      } else {
        newResults.push({
          test: "Database Connection",
          status: "success",
          message: "Successfully connected to memories table"
        })
      }

      // Test 3: Check for new columns
      const { data: columnsData, error: columnsError } = await supabase
        .from("memories")
        .select(
          "embedding, cluster_id, relevance_score, access_count, last_accessed, semantic_tags, memory_type, importance_score"
        )
        .limit(1)

      if (columnsError) {
        newResults.push({
          test: "New Columns",
          status: "error",
          message: columnsError.message
        })
      } else {
        newResults.push({
          test: "New Columns",
          status: "success",
          message: "All new columns are available",
          data: Object.keys(columnsData[0] || {})
        })
      }

      // Test 4: Check clusters table
      const { data: clustersData, error: clustersError } = await supabase
        .from("memory_clusters")
        .select("*")
        .limit(1)

      if (clustersError) {
        newResults.push({
          test: "Clusters Table",
          status: "error",
          message: clustersError.message
        })
      } else {
        newResults.push({
          test: "Clusters Table",
          status: "success",
          message: "Memory clusters table is accessible",
          data: { cluster_count: clustersData?.length || 0 }
        })
      }

      // Test 5: API endpoints
      try {
        const statsResponse = await fetch(
          `/api/memory/stats?user_id=${user.id}`
        )
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          newResults.push({
            test: "Memory Stats API",
            status: "success",
            message: "Memory stats API is working",
            data: statsData
          })
        } else {
          newResults.push({
            test: "Memory Stats API",
            status: "error",
            message: `API returned ${statsResponse.status}: ${statsResponse.statusText}`
          })
        }
      } catch (apiError) {
        newResults.push({
          test: "Memory Stats API",
          status: "error",
          message: `API call failed: ${apiError}`
        })
      }

      // Test 6: User's memories count
      const { data: userMemories, error: userMemoriesError } = await supabase
        .from("memories")
        .select("id")
        .eq("user_id", user.id)

      if (userMemoriesError) {
        newResults.push({
          test: "User Memories",
          status: "error",
          message: userMemoriesError.message
        })
      } else {
        newResults.push({
          test: "User Memories",
          status: "success",
          message: `Found ${userMemories?.length || 0} memories for user`,
          data: { memory_count: userMemories?.length || 0 }
        })
      }
    } catch (error) {
      newResults.push({
        test: "General",
        status: "error",
        message: `Unexpected error: ${error}`
      })
    }

    setResults(newResults)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="size-4 text-green-500" />
      case "error":
        return <XCircle className="size-4 text-red-500" />
      case "warning":
        return <AlertCircle className="size-4 text-yellow-500" />
      default:
        return <AlertCircle className="size-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <Brain className="size-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Memory System Debug</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Tests</CardTitle>
          <CardDescription>
            Run diagnostic tests to check the memory system setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="w-full">
            {loading ? "Running Tests..." : "Run Debug Tests"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          {results.map((result, index) => (
            <Card key={index} className={getStatusColor(result.status)}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <CardTitle className="text-lg">{result.test}</CardTitle>
                  <Badge
                    variant={
                      result.status === "success"
                        ? "default"
                        : result.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-gray-700">{result.message}</p>
                {result.data && (
                  <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
