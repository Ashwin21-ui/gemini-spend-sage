"use client"

import { useState, useEffect, memo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, FileText, Clock, Trash2, MessageSquare, Home, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface ChatSession {
  chat_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ChatSidebarComponent() {
  const navigate = useNavigate()
  const { token, logout, user } = useAuth()
  const { toast } = useToast()
  const { state } = useSidebar()

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Memoized function to fetch chat history
  const fetchChatHistory = async () => {
    if (!token) return

    try {
      const accountId = localStorage.getItem("account_id")
      const url = accountId
        ? `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/history/list?account_id=${accountId}`
        : `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/history/list`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        // Only show chats that have messages
        const nonEmptyChats = data.filter((chat: any) => chat.message_count > 0)
        setChatHistory(nonEmptyChats)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to fetch chat history:", error)
      }
    }
  }

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory()
  }, [token])

  const handleNewChat = async () => {
    const accountId = localStorage.getItem("account_id")
    if (!accountId) {
      toast({
        title: "No Account Selected",
        description: "Please upload a bank statement first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/sessions/new`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ account_id: accountId }),
        }
      )

      if (res.ok) {
        const chat = await res.json()
        setSelectedChat(chat.chat_id)
        // Refresh chat history after creating new chat
        await fetchChatHistory()
        navigate("/chat", { state: { chatId: chat.chat_id, isNew: true } })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId)
    navigate("/chat", { state: { chatId } })
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/sessions/${chatId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.ok) {
        setChatHistory(chatHistory.filter((chat) => chat.chat_id !== chatId))
        toast({
          title: "Chat Deleted",
          description: "Chat has been removed from history",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Sidebar>
      <SidebarContent className="bg-card/50">
        {/* New Chat Section */}
        <SidebarGroup>
          <Button
            onClick={handleNewChat}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {state === "collapsed" ? "" : "New Chat"}
          </Button>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Home Section */}
        <SidebarGroup>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Home className="w-4 h-4" />
            {state !== "collapsed" && "Home"}
          </Button>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Statements Section */}
        <SidebarGroup>
          <Button
            onClick={() => navigate("/statements")}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <FileText className="w-4 h-4" />
            {state !== "collapsed" && "View Statements"}
          </Button>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Chat History Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {state !== "collapsed" && "History"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <SidebarMenuItem key={chat.chat_id}>
                    <div className="flex items-center w-full gap-1 group/menu-item">
                      <SidebarMenuButton
                        onClick={() => handleSelectChat(chat.chat_id)}
                        isActive={selectedChat === chat.chat_id}
                        className="flex-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {state !== "collapsed" && (
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm">{chat.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(chat.created_at)}
                            </div>
                          </div>
                        )}
                      </SidebarMenuButton>
                      {state !== "collapsed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/menu-item:opacity-100"
                          onClick={(e) => handleDeleteChat(chat.chat_id, e)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  {state !== "collapsed" && "No chat history"}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Profile and Logout Section */}
      <SidebarFooter className="bg-card/50 border-t border-border">
        <SidebarGroup>
          {/* Profile Info */}
          {state !== "collapsed" && user && (
            <div className="px-2 py-3 bg-muted rounded-lg mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            {state !== "collapsed" && "Logout"}
          </Button>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

export const ChatSidebar = memo(ChatSidebarComponent)
