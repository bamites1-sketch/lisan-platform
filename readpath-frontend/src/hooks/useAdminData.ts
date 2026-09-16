// useAdminData — fetches real data from /api/admin/* endpoints
// Each hook returns { data, loading, error, reload }
import { useState, useEffect, useCallback } from 'react'
import { adminApi, type ApiStudent, type ApiTeacher, type ApiParent, type ApiUser, type ApiPassage, type ApiQuestion, type ApiVocabulary, type ApiLesson, type ApiAnalytics, type ApiDashboardStats } from '../services/api'

function useApiData<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = useCallback(() => {
    const ac = new AbortController()
    setLoading(true); setError('')
    fetcher(ac.signal)
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { if (e.name !== 'AbortError') { setError(e.message || 'Load failed'); setLoading(false) } })
    return () => ac.abort()
  }, []) // eslint-disable-line

  useEffect(() => { return load() }, [load])

  return { data, loading, error, reload: load }
}

export const useAdminStudents    = () => useApiData<ApiStudent[]>    (s => adminApi.students(s))
export const useAdminTeachers    = () => useApiData<ApiTeacher[]>    (s => adminApi.teachers(s))
export const useAdminParents     = () => useApiData<ApiParent[]>     (s => adminApi.parents(s))
export const useAdminUsers       = () => useApiData<ApiUser[]>       (s => adminApi.users(s))
export const useAdminDashboard   = () => useApiData<ApiDashboardStats>(s => adminApi.dashboard(s))
export const useAdminAnalytics   = () => useApiData<ApiAnalytics>    (s => adminApi.analytics(s))
export const useAdminPassages    = () => useApiData<ApiPassage[]>    (s => adminApi.passages(s))
export const useAdminQuestions   = () => useApiData<ApiQuestion[]>   (s => adminApi.questions(s))
export const useAdminVocabulary  = () => useApiData<ApiVocabulary[]> (s => adminApi.vocabulary(s))
export const useAdminLessons     = () => useApiData<ApiLesson[]>     (s => adminApi.lessons(s))
