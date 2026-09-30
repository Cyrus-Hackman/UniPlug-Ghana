"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Image from "next/image"
import Link from "next/link"
import {
  Send,
  ArrowLeft,
  CheckCircle,
  ImageIcon,
  Loader2,
  MessageCircle,
} from "lucide-react"
import { cn, getInitials, formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface Conversation {
  id: string
  lastMessageAt: string
  listing?: {
    id: string
    title: string
    slug: string
    status: string
    images: Array<{ url: string }>
  }
  participants: Array<{
    userId: string
    unreadCount: number
    user: {
      id: string
      profile: { fullName: string; avatarUrl: string | null }
    }
  }>
  messages: Array<{ content: string; createdAt: string; senderId: string }>
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    profile: { fullName: string; avatarUrl: string | null }
  }
}

function ConversationList({
  conversations,
  activeId,
  userId,
  onSelect,
}: {
  conversations: Conversation[]
  activeId?: string
  userId: string
  onSelect?: () => void
}) {
  return (
    <div className="divide-y divide-gray-50">
      {conversations.map(conv => {
        const other = conv.participants.find(p => p.userId !== userId)
        const lastMsg = conv.messages[0]
        const myParticipant = conv.participants.find(p => p.userId === userId)
        const unread = myParticipant?.unreadCount || 0

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            onClick={onSelect}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors",
              activeId === conv.id && "bg-green-50"
            )}
          >
            <div className="avatar w-10 h-10 text-sm shrink-0">
              {other?.user.profile?.avatarUrl ? (
                <Image
                  src={other.user.profile.avatarUrl}
                  alt={other?.user.profile?.fullName || ""}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(other?.user.profile?.fullName || "U")
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-sm font-semibold truncate", unread > 0 ? "text-gray-900" : "text-gray-700")}>
                  {other?.user.profile?.fullName || "Student"}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {lastMsg ? formatRelativeDate(lastMsg.createdAt) : ""}
                </span>
              </div>
              {conv.listing && (
                <p className="text-xs text-green-800 truncate font-medium">{conv.listing.title}</p>
              )}
              {lastMsg && (
                <p className={cn("text-xs truncate mt-0.5", unread > 0 ? "text-gray-600 font-medium" : "text-gray-400")}>
                  {lastMsg.senderId === userId ? "You: " : ""}{lastMsg.content}
                </p>
              )}
            </div>
            {unread > 0 && (
              <div className="w-5 h-5 bg-green-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {unread > 9 ? "9+" : unread}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const conversationId = params?.conversationId as string | undefined

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const userId = session?.user?.id || ""

  const activeConversation = conversations.find(c => c.id === conversationId)
  const otherParticipant = activeConversation?.participants.find(p => p.userId !== userId)

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations")
    const data = await res.json()
    if (data.success) setConversations(data.data)
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    const data = await res.json()
    if (data.success) {
      setMessages(data.data)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [conversationId])

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
    }
  }, [session, fetchConversations])

  useEffect(() => {
    fetchMessages()
    inputRef.current?.focus()
  }, [fetchMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    const content = newMessage.trim()
    setSending(true)
    setNewMessage("")

    // Optimistic update
    const optimisticMsg: Message = {
      id: "temp-" + Date.now(),
      content,
      senderId: userId,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        profile: { fullName: session?.user?.name || "You", avatarUrl: null },
      },
    }
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev.filter(m => m.id !== optimisticMsg.id), data.data])
        fetchConversations()
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setNewMessage(content)
      toast({ title: "Failed to send", description: "Please try again.", variant: "error" })
    } finally {
      setSending(false)
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <main className="h-[calc(100vh-4rem)] flex overflow-hidden bg-gray-50">
        {/* Sidebar — Conversation List */}
        <div className={cn(
          "border-r border-gray-100 bg-white flex flex-col",
          conversationId ? "hidden md:flex w-80" : "flex w-full md:w-80"
        )}>
          <div className="px-4 py-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : conversations.length > 0 ? (
              <ConversationList
                conversations={conversations}
                activeId={conversationId}
                userId={userId}
              />
            ) : (
              <div className="empty-state py-16">
                <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No messages yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Find something in the marketplace and message the seller.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <Link href="/messages" className="md:hidden btn-icon btn-ghost text-gray-400">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              {otherParticipant && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="avatar w-9 h-9 text-sm">
                    {otherParticipant.user.profile?.avatarUrl ? (
                      <Image
                        src={otherParticipant.user.profile.avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(otherParticipant.user.profile?.fullName || "U")
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {otherParticipant.user.profile?.fullName || "Student"}
                    </div>
                    {activeConversation?.listing && (
                      <Link
                        href={`/listing/${activeConversation.listing.slug}`}
                        className="text-xs text-green-800 truncate hover:underline"
                      >
                        Re: {activeConversation.listing.title}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === userId
                  return (
                    <div key={msg.id} className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
                      {!isMine && (
                        <div className="avatar w-6 h-6 text-[10px] shrink-0">
                          {msg.sender.profile?.avatarUrl ? (
                            <Image
                              src={msg.sender.profile.avatarUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(msg.sender.profile?.fullName || "U")
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-xs px-4 py-2.5 rounded-2xl text-sm",
                          isMine
                            ? "message-bubble-sent"
                            : "message-bubble-received"
                        )}
                      >
                        <p>{msg.content}</p>
                        <p className={cn("text-[10px] mt-0.5 text-right", isMine ? "text-white/60" : "text-gray-400")}>
                          {formatRelativeDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1 py-2.5"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="btn-primary w-10 h-10 p-0 rounded-xl disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center">
            <div>
              <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400">Select a conversation</h3>
              <p className="text-sm text-gray-300 mt-1">Choose a chat from the list to start messaging.</p>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
