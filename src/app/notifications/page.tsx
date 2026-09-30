"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import {
  Bell,
  MessageCircle,
  Tag,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react"
import { formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/notifications")
      return
    }

    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session, status])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        setNotifications(data.data)
      } else {
        // Sample demo notifications for Ghanaian students
        setNotifications([
          {
            id: "notif-1",
            type: "NEW_OFFER",
            title: "New Price Offer Received! 🏷️",
            body: "Kojo Mensah offered GHS 70 for your 'Calculus for Engineers - Stroud 7th Edition'.",
            link: "/offers",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: "notif-2",
            type: "NEW_MESSAGE",
            title: "New Message from Ama Asante 💬",
            body: "Is the Casio fx-991EX calculator still available to borrow for tomorrow's quiz?",
            link: "/messages",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            id: "notif-3",
            type: "ACCOUNT_VERIFIED",
            title: "Student Email Verified! 🎓",
            body: "Your University of Ghana student domain was verified. Your verified badge is now active!",
            link: "/settings",
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: "notif-4",
            type: "NEW_REVIEW",
            title: "5-Star Rating Received ⭐",
            body: "Kwame Mensah left you a 5-star review: 'Punctual meeting at Balme Library! Great book.'",
            link: "/transactions",
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          },
        ])
      }
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
    } catch {}
    toast({ title: "All notifications marked as read", variant: "success" })
  }

  const markSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {})
  }

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead
    return true
  })

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_OFFER":
      case "OFFER_ACCEPTED":
      case "OFFER_COUNTERED":
        return <Tag className="w-5 h-5 text-yellow-600" />
      case "NEW_MESSAGE":
        return <MessageCircle className="w-5 h-5 text-purple-600" />
      case "ACCOUNT_VERIFIED":
        return <ShieldCheck className="w-5 h-5 text-green-700" />
      case "NEW_REVIEW":
        return <Star className="w-5 h-5 text-amber-500 fill-current" />
      default:
        return <Bell className="w-5 h-5 text-green-800" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-3xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="badge badge-gold font-bold text-xs">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">
                Real-time updates regarding your listings, bids, messages, and campus peer ratings.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn-secondary btn-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "ALL"
                  ? "bg-green-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "UNREAD"
                  ? "bg-green-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">No {filter === "UNREAD" ? "unread " : ""}notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                You're completely caught up! We will alert you whenever someone chats, offers, or rents your items.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markSingleRead(item.id)}
                  className={`card card-body p-4 transition-all duration-200 border flex items-start gap-4 ${
                    !item.isRead
                      ? "bg-white border-green-200 shadow-sm"
                      : "bg-gray-50/70 border-gray-100 opacity-90"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm ${
                          !item.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.body}</p>

                    {item.link && (
                      <div className="mt-3">
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-xs font-bold text-green-800 hover:underline"
                        >
                          View details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {!item.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0 mt-2"></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
