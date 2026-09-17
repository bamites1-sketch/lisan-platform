import { apiUrl, apiBase } from '../lib/apiBase'

export default function DiagnosticPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Frontend Diagnostic Page</h1>
      
      <h2>Environment Variables:</h2>
      <pre>
        VITE_API_URL = {import.meta.env.VITE_API_URL || '(undefined)'}
      </pre>
      
      <h2>API Configuration:</h2>
      <pre>
        apiBase = {apiBase || '(empty string)'}
        {'\n'}
        apiUrl('/api/auth/login') = {apiUrl('/api/auth/login')}
      </pre>
      
      <h2>Test API Call:</h2>
      <button onClick={async () => {
        try {
          const url = apiUrl('/health')
          console.log('Calling:', url)
          const res = await fetch(url)
          const data = await res.json()
          alert('Success: ' + JSON.stringify(data))
        } catch (e) {
          alert('Error: ' + (e as Error).message)
        }
      }}>
        Test /health endpoint
      </button>
    </div>
  )
}
