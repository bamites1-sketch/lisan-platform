import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUnreadCount } from '../../services/notificationService'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    const count = await fetchUnreadCount()
    setUnread(count)
  }, [])

  useEffect(() => {
    // Fetch immediately, then poll every 15 s
    refresh()
    const iv = setInterval(refresh, 15_000)
    return () => clearInterval(iv)
  }, [refresh])

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
