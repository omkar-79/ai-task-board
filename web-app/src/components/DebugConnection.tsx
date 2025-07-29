'use client'

import React, { useState, useEffect } from 'react'
import { supabase, testConnection } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export const DebugConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [envVars, setEnvVars] = useState<any>({})
  const { user } = useAuth()

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check environment variables
        const env = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        }
        setEnvVars(env)

        if (env.supabaseUrl === 'Missing' || env.supabaseKey === 'Missing') {
          setConnectionStatus('Environment variables missing')
          return
        }

        // Test connection
        const isConnected = await testConnection()
        if (isConnected) {
          setConnectionStatus('Connected successfully')
        } else {
          setConnectionStatus('Connection failed')
        }
      } catch (error) {
        setConnectionStatus(`Error: ${error}`)
      }
    }

    checkConnection()
  }, [])

  const testAuth = async () => {
    if (!user) {
      alert('No user logged in')
      return
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('count')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        alert(`Auth test failed: ${error.message}`)
      } else {
        alert('Auth test successful')
      }
    } catch (error) {
      alert(`Auth test error: ${error}`)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug Connection</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Environment Variables:</strong>
          <pre className="text-sm bg-white p-2 rounded">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Connection Status:</strong> {connectionStatus}
        </div>

        <div>
          <strong>User:</strong> {user ? user.email : 'Not logged in'}
        </div>

        <button
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Auth
        </button>
      </div>
    </div>
  )
} 