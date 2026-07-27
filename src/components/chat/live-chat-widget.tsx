"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, PhoneCall, Bot, User, CheckCircle2, Trash2, Sparkles, Loader2, Minimize2 } from "lucide-react";
import { apiService } from "@/lib/services/api";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  session_id: string;
  sender: "customer" | "admin" | "ai";
  sender_name: string;
  message: string;
  created_at: string;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "callback">("chat");

  // Chat State
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Callback State
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbNotes, setCbNotes] = useState("");
  const [cbSubmitted, setCbSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize unique session ID
  useEffect(() => {
    let sid = localStorage.getItem("isbah_chat_session_id");
    if (!sid) {
      sid = `cs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem("isbah_chat_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Load chat messages & listen for real-time updates
  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const allMsgs = await apiService.getChatMessages(sessionId);
      setMessages(allMsgs);
    } catch (err) {
      console.warn("Failed to load chat messages", err);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadMessages();
      const handleUpdate = () => loadMessages();
      window.addEventListener("isbah_data_updated", handleUpdate);
      window.addEventListener("isbah_chat_updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      // Poll interval for seamless real-time responses
      const interval = setInterval(loadMessages, 3000);

      return () => {
        window.removeEventListener("isbah_data_updated", handleUpdate);
        window.removeEventListener("isbah_chat_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        clearInterval(interval);
      };
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    const userMsgText = inputText.trim();
    setInputText("");

    // 1. Send user message
    const userMsg = await apiService.sendChatMessage({
      session_id: sessionId,
      sender: "customer",
      sender_name: "Customer",
      message: userMsgText,
    });

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Instant AI Smart Travel Assistant response
    setTimeout(async () => {
      let replyText = "Hello! Thanks for reaching out to Isbah Travels. An agent is reviewing your inquiry right now.";
      const lower = userMsgText.toLowerCase();

      if (lower.includes("flight") || lower.includes("ticket") || lower.includes("biman") || lower.includes("emirates")) {
        replyText = "We offer instant flight booking with Biman Bangladesh, US-Bangla, Emirates, and Air Astra. What is your destination and travel date?";
      } else if (lower.includes("hotel") || lower.includes("resort") || lower.includes("room") || lower.includes("cox")) {
        replyText = "We have 50+ partner hotels & resorts in Cox's Bazar, Sylhet, and Dhaka with up to 15% discount. Would you like to check room rates?";
      } else if (lower.includes("visa") || lower.includes("umrah") || lower.includes("dubai") || lower.includes("saudi")) {
        replyText = "Our Visa team processes Saudi Umrah E-Visas, Dubai Tourist Visas, Thailand & Schengen visas. Would you like us to call you with document requirements?";
      } else if (lower.includes("call") || lower.includes("phone") || lower.includes("number") || lower.includes("contact")) {
        replyText = "Our hotline is +880 1700-123456. You can also submit a callback request using the 'Call Back' tab above!";
      }

      const aiMsg = await apiService.sendChatMessage({
        session_id: sessionId,
        sender: "ai",
        sender_name: "Isbah AI Assistant",
        message: replyText,
      });

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbName || !cbPhone) return;

    await apiService.submitTourInquiry({
      name: cbName,
      phone: cbPhone,
      email: "customer@chat.com",
      additional_requirements: `Homepage Live Call Request: ${cbNotes || "Instant Callback Requested"}`,
    });

    setCbSubmitted(true);
    setCbName("");
    setCbPhone("");
    setCbNotes("");
    setTimeout(() => setCbSubmitted(false), 5000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:px-5 sm:py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-700/50 group"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-outfit font-black text-xs hidden sm:inline-block tracking-wide">
            Live Chat & Support
          </span>
        </button>
      )}

      {/* Floating Chat Popup Box */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-slate-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-outfit font-black text-sm text-white leading-tight">
                  Isbah Travels Support
                </h3>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online • Instant Response</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
              <span>Live Chat</span>
            </button>
            <button
              onClick={() => setActiveTab("callback")}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "callback" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <PhoneCall className="h-3.5 w-3.5 text-amber-600" />
              <span>Call Back Request</span>
            </button>
          </div>

          {/* Tab 1: Live Chat Conversation */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              
              {/* Message List */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-2 my-auto">
                    <Bot className="h-8 w-8 text-emerald-700 mx-auto animate-bounce" />
                    <p className="font-bold text-xs text-slate-900">Welcome to Isbah Travels Live Chat!</p>
                    <p className="text-[11px] text-slate-500">Ask us about flight tickets, hotel rooms, tour packages, or visa processing.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCustomer = msg.sender === "customer";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                          {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isCustomer
                              ? "bg-slate-900 text-white rounded-br-xs"
                              : msg.sender === "ai"
                              ? "bg-emerald-50 text-emerald-950 border border-emerald-200/80 rounded-bl-xs"
                              : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold p-1">
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                    <span>Isbah AI Assistant is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
                />
                <Button type="submit" size="sm" className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1">
                  <span>Send</span>
                  <Send className="h-3 w-3" />
                </Button>
              </form>

            </div>
          )}

          {/* Tab 2: Quick Callback Request */}
          {activeTab === "callback" && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
              <div className="space-y-1">
                <h4 className="font-outfit font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-emerald-700" />
                  <span>Request Instant Phone Call</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Leave your phone number and our travel agent will call you back within 15 minutes.
                </p>
              </div>

              {cbSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 my-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-xs text-emerald-950">Callback Request Received!</p>
                  <p className="text-[11px] text-emerald-700">Our senior travel agent will call your mobile number shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={cbName}
                      onChange={(e) => setCbName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01700-123456"
                      value={cbPhone}
                      onChange={(e) => setCbPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Requirements / Service Needed</label>
                    <textarea
                      rows={2}
                      placeholder="Flight ticket, Umrah package, Hotel reservation..."
                      value={cbNotes}
                      onChange={(e) => setCbNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>

                  <Button type="submit" size="sm" className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Submit Callback Request</span>
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
