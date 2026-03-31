import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, ArrowLeft, Sparkles, User, Bot, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SourcesCard } from "@/components/SourcesCard";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  messageId?: string;
}

const loadingMessages = [
  "Reading your statement...",
  "Analyzing spending patterns...",
  "Finding relevant transactions...",
  "Generating insights...",
  "Almost done...",
];

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { token } = useAuth();

  const [chatId, setChatId] = useState<string | null>(
    location.state?.chatId || null
  );
  const [isNewChat, setIsNewChat] = useState<boolean>(location.state?.isNew || false);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasLoadedChat, setHasLoadedChat] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Track location changes and update chat state
  useEffect(() => {
    const newChatId = location.state?.chatId || null;
    const newIsNew = location.state?.isNew || false;
    
    console.log(`[Location Change] chatId: ${newChatId}, isNew: ${newIsNew}`);
    setChatId(newChatId);
    setIsNewChat(newIsNew);
    setHasLoadedChat(false); // Reset to allow re-fetch
  }, [location]);

  // Initialize chat if chatId is provided
  useEffect(() => {
    const initializeChat = async () => {
      console.log(`[Init] Starting: chatId=${chatId}, isNewChat=${isNewChat}, hasLoadedChat=${hasLoadedChat}`);
      
      // For new chats, don't fetch - they're empty
      if (isNewChat) {
        console.log(`[Init] New chat detected, skipping fetch`);
        setMessages([]);
        setHasLoadedChat(true);
        return;
      }

      // For existing chats, fetch from database
      if (!chatId || !token) {
        console.log(`[Init] Missing chatId or token, setting empty messages`);
        setMessages([]);
        setHasLoadedChat(true);
        return;
      }

      try {
        console.log(`[Init] Fetching messages for chat ${chatId}`);
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/sessions/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          console.log(`[Init] Got response:`, {
            title: data.title,
            messageCount: data.messages?.length || 0,
            firstMessage: data.messages?.[0]?.content?.substring(0, 50),
          });
          setChatTitle(data.title);
          
          if (data.messages && data.messages.length > 0) {
            const loadedMessages = data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              sources: msg.sources,
              messageId: msg.message_id,
            }));
            console.log(`[Init] Setting ${loadedMessages.length} messages`);
            setMessages(loadedMessages);
          } else {
            console.log(`[Init] No messages in response`);
            setMessages([]);
          }
        } else {
          const errorText = await res.text();
          console.error(`[Init] API error: ${res.status} - ${errorText}`);
        }
      } catch (error) {
        console.error("[Init] Fetch error:", error);
      } finally {
        console.log(`[Init] Complete, setting hasLoadedChat=true`);
        setHasLoadedChat(true);
      }
    };

    initializeChat();
  }, [chatId, isNewChat, token]);

  // Handle pending message after new chat is created
  useEffect(() => {
    const processPendingMessage = async () => {
      const pendingMessage = location.state?.pendingMessage;
      const pendingAccountId = location.state?.accountId;

      if (isNewChat && hasLoadedChat && chatId && pendingMessage && token) {
        console.log(`[PendingMessage] Processing pending message: ${pendingMessage}`);
        const userMessage: Message = { role: "user", content: pendingMessage };
        setMessages([userMessage]);
        
        // Save message to DB
        await saveMessageToDb("user", pendingMessage, undefined, chatId);
        
        // Send query
        setIsLoading(true);
        await sendQuery(pendingMessage, chatId, pendingAccountId);
      }
    };

    processPendingMessage();
  }, [isNewChat, hasLoadedChat, chatId, token, location.state?.pendingMessage]);

  // Rotate loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // ✅ Add this effect to auto-insert spending summary (only for new chats with fresh data)
  useEffect(() => {
    // Only show summary for new chats
    if (!isNewChat) return;
    
    const dataStr = sessionStorage.getItem("extractedData");
    if (!dataStr) return;

    const data = JSON.parse(dataStr);
    const summary = data?.summary;
    const account = data?.account_details;

    // ✅ Prevent duplicate summary messages
    const alreadyHasSummary = messages.some((m) =>
      m.content.includes("**Activity Summary**")
    );
    if (alreadyHasSummary) return;

    if (summary && account && messages.length > 0) {
      const summaryMessage: Message = {
        role: "assistant",
        content: `Here's a quick overview of your recent spending:\n
• **Account Holder:** ${account.account_holder_name}
• **Account Number:** ${account.account_number}
• **Statement Period:** ${account.statement_start_date} → ${account.statement_end_date}
• **Opening Balance:** ${summary.opening_balance}
• **Closing Balance:** ${summary.closing_balance}

**Activity Summary**
• Total Credits: ${summary.total_credits} (${summary.credit_count} entries)
• Total Debits: ${summary.total_debits} (${summary.debit_count} entries)

You can ask things like:
• "Where did I spend the most?"
• "Show me recurring expenses"
• "How much did I spend on food?"`,
      };

      setMessages((prev) => [prev[0], summaryMessage, ...prev.slice(1)]);
    }
  }, [isNewChat, messages.length]);

  const saveMessageToDb = async (
    role: "user" | "assistant",
    content: string,
    sources?: any[],
    messagesChatId?: string
  ) => {
    const idToUse = messagesChatId || chatId;
    if (!idToUse || !token) return;

    try {
      setIsSavingMessage(true);
      console.log(`[SaveMessage] Saving ${role} message to chat ${idToUse}`);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat/sessions/${idToUse}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chat_id: idToUse, role, content, sources }),
        }
      );

      if (!res.ok) {
        console.error(`[SaveMessage] Failed to save message: ${res.status} ${await res.text()}`);
      } else {
        const responseData = await res.json();
        console.log(`[SaveMessage] Saved successfully:`, responseData);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Create new chat if not exists
    if (!chatId) {
      try {
        const accountId = localStorage.getItem("account_id");
        if (!accountId) {
          throw new Error(
            "No active account session found. Please upload a bank statement first."
          );
        }

        console.log("[HandleSend] Creating new chat...");
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
        );

        if (!res.ok) throw new Error("Failed to create chat");
        const newChat = await res.json();
        
        // Navigate with the new chat state - use navigate to update location state properly
        console.log(`[HandleSend] Navigating to new chat ${newChat.chat_id}`);
        navigate("/chat", { 
          state: { 
            chatId: newChat.chat_id, 
            isNew: true,
            pendingMessage: input.trim(),
            accountId: accountId
          } 
        });
        setInput("");
        return;
      } catch (error) {
        console.error("[HandleSend] Error creating new chat:", error);
        toast({
          title: "Error",
          description: "Failed to create chat session. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage: Message = { role: "user", content: input };
    const query = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await saveMessageToDb("user", query);
    setIsLoading(true);

    const accountId = localStorage.getItem("account_id");
    await sendQuery(query, chatId, accountId!);
  };

  const sendQuery = async (
    query: string,
    currentChatId: string,
    accountId: string
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            account_id: accountId,
            query: query,
            top_k: 10,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to analyze data");

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
      };

      await saveMessageToDb("assistant", data.answer, data.sources, currentChatId);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ChatSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
          {/* Header */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="rounded-xl" />
                <div>
                  <h1 className="text-xl font-bold">Finance Assistant</h1>
                  <p className="text-sm text-muted-foreground">
                    AI-powered insights
                  </p>
                </div>
              </div>
              <div className="flex flex-col text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/upload")}
                  className="rounded-xl border-primary/20 hover:border-primary/50 text-primary"
                >
                  + Upload PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className={`flex gap-3 animate-slide-up ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="max-w-[80%] ml-13">
                        <SourcesCard sources={message.sources} />
                      </div>
                    )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        {loadingMessages[messageIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="bg-card/50 backdrop-blur-sm border-t border-border p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about your spending..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border-border focus-visible:ring-primary"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl"
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Chat;
