"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  getMemoriesByUserId,
  getUserMemoryClusters,
  getMemoriesInCluster,
  getUserMemoryStats,
  markMemoryAccessed
} from "@/lib/memory-client"
import type { Memory, MemoryCluster, MemoryStats } from "@/types/memory"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Clock,
  TrendingUp,
  Tag,
  Star,
  Users,
  FolderOpen,
  Activity,
  Target,
  RefreshCw
} from "lucide-react"

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [clusters, setClusters] = useState<MemoryCluster[]>([])
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [clusterMemories, setClusterMemories] = useState<Memory[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [regenerating, setRegenerating] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        console.log("❌ No user found")
        setLoading(false)
        return
      }

      console.log("👤 Loading data for user:", user.id)

      try {
        console.log("📡 Fetching memories...")
        const memoriesData = await getMemoriesByUserId(user.id)
        console.log("✅ Memories loaded:", memoriesData.length, "memories")

        console.log("📡 Fetching clusters...")
        const clustersData = await getUserMemoryClusters(user.id)
        console.log("✅ Clusters loaded:", clustersData.length, "clusters")

        console.log("📡 Fetching stats...")
        const statsData = await getUserMemoryStats(user.id)
        console.log("✅ Stats loaded:", statsData)

        setMemories(memoriesData)
        setClusters(clustersData)
        setStats(statsData)
      } catch (error) {
        console.error("❌ Error loading memory data:", error)
        // Set empty arrays to prevent undefined errors
        setMemories([])
        setClusters([])
        setStats(null)
      }

      setLoading(false)
    }
    loadData()
  }, [supabase])

  const handleClusterSelect = async (clusterId: string) => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    try {
      const clusterMemoriesData = await getMemoriesInCluster(clusterId, user.id)
      setClusterMemories(clusterMemoriesData)
      setSelectedCluster(clusterId)
    } catch (error) {
      console.error("Error loading cluster memories:", error)
    }
  }

  const handleMemoryClick = async (memoryId: string) => {
    await markMemoryAccessed(memoryId)
    // Refresh the memory to show updated access count
    const updatedMemories = memories.map(memory =>
      memory.id === memoryId
        ? { ...memory, access_count: memory.access_count + 1 }
        : memory
    )
    setMemories(updatedMemories)
  }

  const handleRegenerateEmbeddings = async () => {
    setRegenerating(true)
    try {
      const response = await fetch("/api/memory/regenerate-embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      const result = await response.json()

      if (response.ok) {
        console.log("✅ Embeddings regenerated:", result)
        // Reload the data
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (user) {
          const [memoriesData, clustersData, statsData] = await Promise.all([
            getMemoriesByUserId(user.id),
            getUserMemoryClusters(user.id),
            getUserMemoryStats(user.id)
          ])
          setMemories(memoriesData)
          setClusters(clustersData)
          setStats(statsData)
        }
      } else {
        console.error("❌ Failed to regenerate embeddings:", result)
      }
    } catch (error) {
      console.error("❌ Error regenerating embeddings:", error)
    } finally {
      setRegenerating(false)
    }
  }

  const getMemoryTypeColor = (type: string) => {
    const colors = {
      personal: "bg-blue-100 text-blue-800",
      preference: "bg-green-100 text-green-800",
      technical: "bg-purple-100 text-purple-800",
      project: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800"
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getRelevanceColor = (score: number) => {
    const safeScore = score || 0
    if (safeScore >= 1.5) return "text-green-600"
    if (safeScore >= 1.0) return "text-yellow-600"
    return "text-red-600"
  }

  const formatScore = (score: number | null) => {
    return (score || 0).toFixed(2)
  }

  const formatCount = (count: number | null) => {
    return count || 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Brain className="animate-spin" />
          <span>Loading your memory system...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="size-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Memory System</h1>
        </div>
        <Button
          onClick={handleRegenerateEmbeddings}
          disabled={regenerating}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw
            className={`size-4 ${regenerating ? "animate-spin" : ""}`}
          />
          <span>
            {regenerating ? "Regenerating..." : "Regenerate Embeddings"}
          </span>
        </Button>
      </div>

      {/* Stats Overview */}
      {stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Memories
              </CardTitle>
              <Brain className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMemories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memory Clusters
              </CardTitle>
              <FolderOpen className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClusters}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Relevance
              </CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatScore(stats.avgRelevanceScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Accesses
              </CardTitle>
              <Activity className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAccessCount}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Memories
              </CardTitle>
              <Brain className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memory Clusters
              </CardTitle>
              <FolderOpen className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Relevance
              </CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.00</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Accesses
              </CardTitle>
              <Activity className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="all">All Memories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Memory Type Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="size-5" />
                  <span>Memory Distribution</span>
                </CardTitle>
                <CardDescription>
                  How your memories are organized by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.typeDistribution).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge className={getMemoryTypeColor(type)}>
                            {type}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {count} memories
                          </span>
                        </div>
                        <div className="w-32">
                          <Progress
                            value={(count / stats.totalMemories) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Memories by Relevance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="size-5" />
                <span>Most Relevant Memories</span>
              </CardTitle>
              <CardDescription>
                Your most important and frequently accessed memories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500">No memories to display yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.slice(0, 5).map(memory => (
                    <div
                      key={memory.id}
                      className="hover:bg-accent cursor-pointer rounded-lg border p-3 transition-colors"
                      onClick={() => handleMemoryClick(memory.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="mb-1 text-sm text-gray-600">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{memory.content}</p>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <Badge
                            className={getMemoryTypeColor(
                              memory.memory_type || "general"
                            )}
                          >
                            {memory.memory_type || "general"}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="size-3" />
                              <span
                                className={getRelevanceColor(
                                  memory.relevance_score
                                )}
                              >
                                {formatScore(memory.relevance_score)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="size-3" />
                              <span>{formatCount(memory.access_count)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          {clusters.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Memory Clusters</CardTitle>
                <CardDescription>
                  Your memories organized into semantic clusters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-6 text-center">
                  <FolderOpen className="mx-auto mb-4 size-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No clusters yet
                  </h3>
                  <p className="text-gray-500">
                    Memory clusters will be created automatically as you add
                    more memories.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clusters.map(cluster => (
                  <Card
                    key={cluster.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCluster === cluster.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() => handleClusterSelect(cluster.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{cluster.name}</CardTitle>
                      <CardDescription>{cluster.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Memories:</span>
                          <span className="font-medium">
                            {formatCount(cluster.memory_count)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Relevance:</span>
                          <span className="font-medium">
                            {formatScore(cluster.average_relevance_score)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created{" "}
                          {new Date(cluster.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Cluster Details */}
              {selectedCluster && clusterMemories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cluster Memories</CardTitle>
                    <CardDescription>
                      Memories in the selected cluster
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clusterMemories.map(memory => (
                        <div
                          key={memory.id}
                          className="hover:bg-accent cursor-pointer rounded-lg border p-3 transition-colors"
                          onClick={() => handleMemoryClick(memory.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="mb-1 text-sm text-gray-600">
                                {new Date(
                                  memory.created_at
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-sm">{memory.content}</p>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              <Badge
                                className={getMemoryTypeColor(
                                  memory.memory_type || "general"
                                )}
                              >
                                {memory.memory_type || "general"}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="size-3" />
                                  <span
                                    className={getRelevanceColor(
                                      memory.relevance_score
                                    )}
                                  >
                                    {formatScore(memory.relevance_score)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Activity className="size-3" />
                                  <span>
                                    {formatCount(memory.access_count)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Memories</CardTitle>
              <CardDescription>
                Complete list of your memories, sorted by relevance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <div className="py-8 text-center">
                  <Brain className="mx-auto mb-4 size-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No memories yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    Your memories will appear here once you start having
                    conversations with the assistant.
                  </p>
                  <div className="text-sm text-gray-400">
                    <p>Try saying things like:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• &quot;My name is [your name]&quot;</li>
                      <li>• &quot;I work as a [your job]&quot;</li>
                      <li>• &quot;I like [your preferences]&quot;</li>
                      <li>
                        • &quot;I&apos;m interested in [your interests]&quot;
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map(memory => (
                    <div
                      key={memory.id}
                      className="hover:bg-accent cursor-pointer rounded-lg border p-3 transition-colors"
                      onClick={() => handleMemoryClick(memory.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center space-x-2">
                            <p className="text-sm text-gray-600">
                              {new Date(memory.created_at).toLocaleDateString()}
                            </p>
                            <Badge
                              className={getMemoryTypeColor(
                                memory.memory_type || "general"
                              )}
                            >
                              {memory.memory_type || "general"}
                            </Badge>
                            {memory.semantic_tags &&
                              memory.semantic_tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="size-3 text-gray-400" />
                                  {memory.semantic_tags
                                    .slice(0, 2)
                                    .map((tag, index) => (
                                      <span
                                        key={index}
                                        className="rounded bg-gray-100 px-1 text-xs text-gray-500"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                          <p className="text-sm">{memory.content}</p>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <div className="space-y-1 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="size-3" />
                              <span
                                className={getRelevanceColor(
                                  memory.relevance_score
                                )}
                              >
                                {formatScore(memory.relevance_score)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="size-3" />
                              <span>{formatCount(memory.access_count)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="size-3" />
                              <span>
                                {formatScore(memory.importance_score)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
