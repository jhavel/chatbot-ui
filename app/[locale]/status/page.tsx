"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap
} from "lucide-react"
import { toast } from "sonner"

// Auto-update configuration
const AUTO_UPDATE_INTERVAL_HOURS = 12
const AUTO_UPDATE_INTERVAL_MS = AUTO_UPDATE_INTERVAL_HOURS * 60 * 60 * 1000

interface StatusTest {
  name: string
  description: string
  status: "pass" | "fail" | "warning"
  details: string
  duration?: number
  error?: string
}

interface StatusReport {
  timestamp: string
  overallStatus: "healthy" | "degraded" | "unhealthy"
  tests: StatusTest[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

export default function StatusPage() {
  const [statusReport, setStatusReport] = useState<StatusReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [nextAutoUpdate, setNextAutoUpdate] = useState<Date | null>(null)
  const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>("")

  const fetchStatus = async (isAutoUpdate = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/status")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStatusReport(data)
      setLastChecked(new Date())

      // Calculate next auto-update time
      const nextUpdate = new Date()
      nextUpdate.setHours(nextUpdate.getHours() + AUTO_UPDATE_INTERVAL_HOURS)
      setNextAutoUpdate(nextUpdate)

      if (isAutoUpdate) {
        toast.success("System status auto-updated")
      } else {
        toast.success("Status check completed")
      }
    } catch (error) {
      console.error("Failed to fetch status:", error)
      toast.error("Failed to fetch system status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Set up automatic refresh
    const autoRefreshInterval = setInterval(() => {
      console.log(
        `Auto-refreshing system status (every ${AUTO_UPDATE_INTERVAL_HOURS} hours)...`
      )
      fetchStatus(true)
    }, AUTO_UPDATE_INTERVAL_MS)

    // Cleanup interval on component unmount
    return () => {
      clearInterval(autoRefreshInterval)
    }
  }, [])

  // Update countdown timer every minute
  useEffect(() => {
    const updateCountdown = () => {
      if (nextAutoUpdate) {
        const now = new Date()
        const diff = nextAutoUpdate.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeUntilUpdate("Updating...")
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeUntilUpdate(`${hours}h ${minutes}m`)
        }
      }
    }

    updateCountdown() // Initial update
    const countdownInterval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(countdownInterval)
  }, [nextAutoUpdate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="size-5 text-green-500" />
      case "fail":
        return <XCircle className="size-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="size-5 text-yellow-500" />
      default:
        return <AlertTriangle className="size-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Pass
          </Badge>
        )
      case "fail":
        return <Badge variant="destructive">Fail</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "degraded":
        return "text-yellow-600"
      case "unhealthy":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="size-8 text-green-500" />
      case "degraded":
        return <AlertTriangle className="size-8 text-yellow-500" />
      case "unhealthy":
        return <XCircle className="size-8 text-red-500" />
      default:
        return <AlertTriangle className="size-8 text-gray-500" />
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A"
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 size-8 animate-spin text-blue-500" />
            <h2 className="text-xl font-semibold">Checking System Status...</h2>
            <p className="mt-2 text-gray-600">
              Running comprehensive system tests
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!statusReport) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Alert>
          <XCircle className="size-4" />
          <AlertDescription>
            Unable to fetch system status. Please check your connection and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { overallStatus, tests, summary } = statusReport
  const successRate = (summary.passed / summary.total) * 100

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Status</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive health check of all system components
            </p>
          </div>
          <Button onClick={() => fetchStatus(false)} disabled={loading}>
            <RefreshCw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Status
          </Button>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {lastChecked && (
            <p className="text-sm text-gray-500">
              Last checked: {formatTimestamp(lastChecked.toISOString())}
            </p>
          )}
          {nextAutoUpdate && (
            <p className="flex items-center gap-1 text-sm text-blue-600">
              <Clock className="size-3" />
              Next auto-update: {timeUntilUpdate} (
              {formatTimestamp(nextAutoUpdate.toISOString())})
            </p>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-3">
            {getOverallStatusIcon(overallStatus)}
            <div>
              <CardTitle className={getOverallStatusColor(overallStatus)}>
                System Status:{" "}
                {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
              </CardTitle>
              <CardDescription>
                Overall system health and performance metrics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.total}
              </div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.passed}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.failed}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.warnings}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span>{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tests.map((test, index) => (
          <Card key={index} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {getStatusBadge(test.status)}
              </div>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">{test.details}</p>

              {test.duration && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="size-4" />
                  <span>Duration: {formatDuration(test.duration)}</span>
                </div>
              )}

              {test.error && (
                <Alert>
                  <XCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    {test.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <Separator className="my-8" />
      <div className="text-center text-sm text-gray-500">
        <p>System status automatically updates every 5 minutes</p>
        <p className="mt-1">
          Report generated at: {formatTimestamp(statusReport.timestamp)}
        </p>
      </div>
    </div>
  )
}
