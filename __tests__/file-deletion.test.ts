import { validateSupabaseConfig } from '../lib/supabase/validation'
import { checkSupabaseConnection } from '../lib/supabase/health-check'

describe('File Deletion System', () => {
  describe('Environment Configuration', () => {
    it('should validate Supabase configuration', () => {
      // This test will fail if environment variables are not set
      expect(() => validateSupabaseConfig()).not.toThrow()
    })
  })

  describe('Database Connection', () => {
    it('should connect to Supabase database', async () => {
      const isConnected = await checkSupabaseConnection()
      expect(isConnected).toBe(true)
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await fetch('http://localhost:3000/api/health')
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('database')
      expect(data).toHaveProperty('timestamp')
    })
  })
}) 