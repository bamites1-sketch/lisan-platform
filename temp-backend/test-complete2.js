const http = require('http')

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    }
    const r = http.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch { resolve({ status: res.statusCode, body: d }) }
      })
    })
    r.on('error', reject)
    if (data) r.write(data)
    r.end()
  })
}

async function main() {
  // Login as student
  const reg = await req('POST', '/api/auth/register', {
    email: `debug.${Date.now()}@test.dev`, password: 'TestPass123!',
    firstName: 'Debug', lastName: 'Test', role: 'STUDENT', grade: 'GRADE_6'
  })
  const token = reg.body.data?.token
  const userId = reg.body.data?.user?.id
  if (!token) { console.log('Registration failed:', JSON.stringify(reg.body)); return }
  console.log('Student created:', userId)

  // Admin token
  const al = await req('POST', '/api/auth/login', { email: 'admin@readpath.com', password: 'password123' })
  const adminToken = al.body.data?.token

  // Start assessment
  const sa = await req('POST', '/api/assessments/start', null, token)
  const assessmentId = sa.body.data?.id
  console.log('Assessment:', assessmentId, 'status:', sa.status)

  // Complete immediately (no responses)
  const comp = await req('POST', `/api/assessments/${assessmentId}/complete`, null, token)
  console.log('Complete status:', comp.status)
  console.log('Complete body:', JSON.stringify(comp.body, null, 2))

  // Cleanup
  if (userId) {
    const del = await req('DELETE', `/api/admin/users/${userId}`, null, adminToken)
    console.log('Cleanup:', del.status, del.body.success ? 'OK' : JSON.stringify(del.body))
  }
}

main().catch(console.error)
