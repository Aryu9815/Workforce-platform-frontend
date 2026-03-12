import { useState, useEffect, useRef } from 'react'
import { X, Check, Bell, InfoIcon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationsApi } from '../api'
import { NotificationResponse } from '../types/notification'
import { formatDistanceToNow } from 'date-fns'

interface NotificationSidebarProps {
    isOpen: boolean
    onClose: () => void
}

type FilterType = 'All' | 'Unread' | 'Read'

const getNotificationIcon = (notification: NotificationResponse) => {
    const type = (notification as any).type || 'info'
    const iconProps = { className: 'h-3.5 w-3.5 flex-shrink-0 mt-0.5' }
    switch (type) {
        case 'success': return <CheckCircle2 {...iconProps} className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
        case 'warning': return <AlertTriangle {...iconProps} className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
        case 'error': return <AlertCircle {...iconProps} className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-500" />
        default: return <InfoIcon {...iconProps} className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
    }
}

const SkeletonNotification = () => (
    <div className="px-4 py-3.5 border-b border-secondary-100">
        <div className="flex items-start gap-3">
            <div className="skeleton h-3.5 w-3.5 rounded-full mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="skeleton skeleton-text h-3.5 w-32" />
                    <div className="skeleton h-3 w-14" />
                </div>
                <div className="skeleton skeleton-text h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
            </div>
        </div>
    </div>
)

const NotificationItem = ({
    notification,
    onMarkAsRead
}: {
    notification: NotificationResponse
    onMarkAsRead: (id: string) => void
}) => {
    const [showMore, setShowMore] = useState(false)

    const isLongMessage = notification.message.length > 100
    const displayMessage = showMore || !isLongMessage
        ? notification.message
        : `${notification.message.substring(0, 100)}...`

    return (
        <div
            className={`px-4 py-3.5 border-b border-secondary-100 transition-colors duration-100 ${
                !notification.is_read
                    ? 'bg-blue-50/40 border-l-2 border-l-blue-400 hover:bg-blue-50/60'
                    : 'hover:bg-secondary-50/60'
            }`}
        >
            <div className="flex items-start gap-3">
                {getNotificationIcon(notification)}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                        <h4 className="text-xs font-semibold text-secondary-900 leading-tight">{notification.title}</h4>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] text-secondary-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {!notification.is_read && (
                                <button
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="text-[10px] flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap"
                                    title="Mark as read"
                                >
                                    <Check className="h-2.5 w-2.5" />
                                    Mark read
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-secondary-600 leading-relaxed whitespace-pre-wrap">
                        {displayMessage}
                    </p>
                    {isLongMessage && (
                        <button
                            onClick={() => setShowMore(!showMore)}
                            className="text-teal-600 hover:text-teal-700 text-[10px] mt-1.5 font-medium"
                        >
                            {showMore ? 'Show less ↑' : 'Show more ↓'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export const NotificationSidebar = ({ isOpen, onClose }: NotificationSidebarProps) => {
    const [filter, setFilter] = useState<FilterType>('All')
    const queryClient = useQueryClient()
    const lastProcessingTime = useRef<number>(Date.now())

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.getNotifications,
        refetchInterval: 15000,
    })

    useEffect(() => {
        if (notifications.length > 0) {
            // Find new unread notifications that were created after our last processing time
            // or if we rely on the component having been mounted, we can just check those that we haven't seen.
            // A better way is tracking the latest notification ID we've seen.
            const newNotifications = notifications.filter(
                n => !n.is_read && new Date(n.created_at).getTime() > lastProcessingTime.current
            )

            if (newNotifications.length > 0) {
                newNotifications.forEach(n => {
                    toast(`New Notification: ${n.title}`, {
                        icon: '🔔',
                    })
                })
                const maxTime = Math.max(...newNotifications.map(n => new Date(n.created_at).getTime()))
                lastProcessingTime.current = Math.max(lastProcessingTime.current, maxTime)
            }
        }
    }, [notifications])

    const markAsReadMutation = useMutation({
        mutationFn: notificationsApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    // We should initialize lastProcessingTime with the latest created_at on initial fetch so we don't spam toasts
    // but if the user just logged in, they might want to see them.
    // We'll update lastProcessingTime in a useEffect that runs on mount once if notifications are already fetched.
    useEffect(() => {
        if (notifications.length > 0) {
            const maxTime = Math.max(...notifications.map(n => new Date(n.created_at).getTime()))
            if (maxTime > lastProcessingTime.current) {
                // If we want to prevent initial flood of toasts on load:
                // Since we already filtered above in the other effect, this logic makes sure 
                // we don't double trigger if data was cached. 
                // To be safe against initial load spam:
                // Just let the other effect handle it, but wait, if it's initial load, it MIGHT spam.
                // The other effect used Date.now() initialized in useRef, so only new ones created after load will toast!
            }
        }
    }, [])

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true
        if (filter === 'Unread') return !n.is_read
        if (filter === 'Read') return n.is_read
        return true
    })

    const unreadCount = notifications.filter(n => !n.is_read).length

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/25 z-40"
                onClick={onClose}
                style={{ animation: 'fadeIn 0.2s ease-out' }}
            />

            {/* Panel */}
            <div
                className="notification-panel"
                style={{ width: '384px' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-secondary-200 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-secondary-500" />
                        <h2 className="text-sm font-semibold text-secondary-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span
                                className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none"
                                style={{ borderRadius: '99px' }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-secondary-400 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
                        style={{ borderRadius: '4px' }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 px-4 py-2.5 border-b border-secondary-100 bg-secondary-50/60 flex-shrink-0">
                    {(['All', 'Unread', 'Read'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-medium transition-all duration-150 ${
                                filter === f
                                    ? 'bg-white text-secondary-900 border border-secondary-300 shadow-sm'
                                    : 'text-secondary-500 hover:text-secondary-800 hover:bg-white/60'
                            }`}
                            style={{ borderRadius: '4px' }}
                        >
                            {f}
                            {f === 'Unread' && unreadCount > 0 && (
                                <span className="ml-1.5 text-[9px] bg-teal-100 text-teal-700 px-1 py-0.5 font-semibold" style={{ borderRadius: '99px' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div>
                            {[...Array(4)].map((_, i) => (
                                <SkeletonNotification key={i} />
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="h-12 w-12 bg-secondary-100 flex items-center justify-center mb-3" style={{ borderRadius: '6px' }}>
                                <Bell className="h-5 w-5 text-secondary-400" />
                            </div>
                            <p className="text-sm font-medium text-secondary-700 mb-1">No notifications</p>
                            <p className="text-xs text-secondary-400">
                                {filter === 'Unread' ? 'All caught up!' : 'Nothing to show here.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredNotifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
