import { useState, useEffect, useMemo } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'
import { apiUrl } from '../../lib/apiBase'

interface PDFResource {
  id: string
  title: string
  description?: string
  fileType: string
  fileName: string
  fileUrl: string
  fileSize: number
  category: string
  grade: string
  difficulty: string
  downloadCount: number
  createdAt: string
}

const CATEGORIES = ['ALL', 'WORKSHEET', 'GUIDE', 'ASSESSMENT', 'TEMPLATE', 'RESOURCE']

export default function ResourcesPage() {
  const [resources, setResources] = useState<PDFResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('lisan_token') ?? ''
      const res = await fetch(apiUrl('/api/students/resources'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Could not load resources')
      const data = await res.json()
      setResources(data.data || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load study resources')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (resource: PDFResource) => {
    try {
      setDownloadingId(resource.id)
      const token = localStorage.getItem('lisan_token') ?? ''
      const res = await fetch(apiUrl(`/api/students/resources/${resource.id}/download`), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const downloadUrl = data.data?.downloadUrl || data.data?.url || resource.fileUrl

      if (downloadUrl) {
        if (downloadUrl.startsWith('data:')) {
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = resource.fileName || `${resource.title}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        } else {
          window.open(downloadUrl, '_blank')
        }
      }
    } catch (err) {
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.fileName.toLowerCase().includes(search.toLowerCase())

      const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [resources, search, selectedCategory])

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileBadge = (type: string) => {
    const t = type.toUpperCase()
    if (t.includes('PDF')) return { icon: '📄', bg: 'bg-red-50 text-red-700 border-red-200' }
    if (t.includes('PPT')) return { icon: '📊', bg: 'bg-orange-50 text-orange-700 border-orange-200' }
    if (t.includes('XLS') || t.includes('EXCEL')) return { icon: '📈', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    return { icon: '📝', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
  }

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#003f3a] to-[#005a53] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f2c94c]/20 text-[#f2c94c] border border-[#f2c94c]/30 mb-3">
              Study Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Learning Materials &amp; Resources</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Access worksheets, reading guides, handouts, and study documents shared by your teachers and Dr. Habtamu to boost your literacy.
            </p>
          </div>
          <div className="absolute right-4 -bottom-6 text-8xl opacity-10 select-none pointer-events-none">
            📚
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search resources by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white transition-all"
            />
            <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-[#003f3a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'ALL' ? 'All Materials' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#003f3a]/20 border-t-[#003f3a] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading study resources...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={loadResources} className="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
              Try Again
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 text-3xl flex items-center justify-center mx-auto mb-4">
              📖
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {search || selectedCategory !== 'ALL' ? 'No matching resources' : 'No learning resources yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
              {search || selectedCategory !== 'ALL'
                ? 'Try adjusting your search terms or filter selection to find what you need.'
                : 'Your educators will upload study guides, printable worksheets, and supplementary books here soon.'}
            </p>
            {(search || selectedCategory !== 'ALL') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('ALL') }}
                className="mt-4 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((res) => {
              const badge = getFileBadge(res.fileType)
              const isDownloading = downloadingId === res.id

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Category & File Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#168f88]/10 text-[#003f3a]">
                        {res.category}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${badge.bg}`}>
                        <span>{badge.icon}</span>
                        <span>{res.fileType}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 group-hover:text-[#003f3a] transition-colors leading-snug mb-1 line-clamp-2">
                      {res.title}
                    </h3>

                    {/* Description */}
                    {res.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {res.description}
                      </p>
                    )}
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{res.grade === 'ALL' ? 'All Grades' : res.grade.replace('GRADE_', 'Grade ')}</span>
                      {res.fileSize ? <span>{formatFileSize(res.fileSize)}</span> : null}
                    </div>

                    <button
                      onClick={() => handleDownload(res)}
                      disabled={isDownloading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003f3a] hover:bg-[#002b28] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <span>📥</span>
                          <span>Download / Open</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
