// Client-side memory functions that use API endpoints
// These are for use in client components like the memories page

export const getMemoriesByUserId = async (user_id: string) => {
  const response = await fetch(`/api/memory/list?user_id=${user_id}`)
  if (!response.ok) throw new Error("Failed to retrieve memories")
  return await response.json()
}

export const getUserMemoryClusters = async (user_id: string) => {
  const response = await fetch(`/api/memory/clusters?user_id=${user_id}`)
  if (!response.ok) throw new Error("Failed to retrieve memory clusters")
  return await response.json()
}

export const getMemoriesInCluster = async (
  clusterId: string,
  user_id: string
) => {
  const response = await fetch(
    `/api/memory/cluster/${clusterId}?user_id=${user_id}`
  )
  if (!response.ok) throw new Error("Failed to retrieve cluster memories")
  return await response.json()
}

export const getUserMemoryStats = async (user_id: string) => {
  const response = await fetch(`/api/memory/stats?user_id=${user_id}`)
  if (!response.ok) throw new Error("Failed to retrieve memory stats")
  return await response.json()
}

export const markMemoryAccessed = async (memoryId: string) => {
  const response = await fetch(`/api/memory/access/${memoryId}`, {
    method: "POST"
  })
  if (!response.ok) throw new Error("Failed to mark memory as accessed")
  return await response.json()
}

export const deleteMemory = async (memoryId: string) => {
  const response = await fetch(`/api/memory/delete/${memoryId}`, {
    method: "DELETE"
  })
  if (!response.ok) throw new Error("Failed to delete memory")
  return await response.json()
}
