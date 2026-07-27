"use client";

import { useState, useEffect, useRef } from "react";
import { apiService } from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Trash2, User, Bot, Clock, RefreshCw, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";

interface ChatSession {
  session_id: string;
  sender_name: string;
  last_message: string;
  last_time: string;
  count: number;
}

interface ChatMsg {
  id: string;
  session_id: string;
  sender: "customer" | "admin" | "ai";
  sender_name: string;
  message: string;
  created_at: string;
}

export default function AdminLiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [activeMessages, setActiveMessages] = useState<ChatMsg[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    try {
      const data = await apiService.getAllChatSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].session_id);
      }
    } catch (err) {
      console.warn("Failed to load chat sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (sid: string) => {
    if (!sid) return;
    try {
      const msgs = await apiService.getChatMessages(sid);
      setActiveMessages(msgs);
    } catch (err) {
      console.warn("Failed to load thread", err);
    }
  };

  useEffect(() => {
    loadSessions();

    const handleUpdate = () => {
      loadSessions();
      if (selectedSessionId) loadThread(selectedSessionId);
    };

    window.addEventListener("isbah_data_updated", handleUpdate);
    window.addEventListener("isbah_chat_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("isbah_data_updated", handleUpdate);
      window.removeEventListener("isbah_chat_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadThread(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useSupabaseRealtime("chat_messages", () => {
    loadSessions();
    if (selectedSessionId) loadThread(selectedSessionId);
  });

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId) return;

    const text = replyText.trim();
    setReplyText("");

    const newMsg = await apiService.sendChatMessage({
      session_id: selectedSessionId,
      sender: "admin",
      sender_name: "Admin Support",
      message: text,
    });

    setActiveMessages((prev) => [...prev, newMsg]);
  };

  const handleDeleteSession = async (sid: string) => {
    if (confirm("Are you sure you want to permanently delete this chat session & document logs?")) {
      await apiService.deleteChatSession(sid);
      const updated = sessions.filter((s) => s.session_id !== sid);
      setSessions(updated);
      if (selectedSessionId === sid) {
        setSelectedSessionId(updated.length > 0 ? updated[0].session_id : "");
        setActiveMessages([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Live Customer Chat Console</h1>
            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
              {sessions.length} Active Sessions
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Real-time multi-channel customer messages, instant AI assistant logs, and direct admin replies.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            loadSessions();
            if (selectedSessionId) loadThread(selectedSessionId);
          }}
          className="text-xs font-bold gap-1.5 rounded-xl self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
          <span>Refresh Threads</span>
        </Button>
      </div>

      {/* Main Grid: Sessions List & Chat Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        
        {/* Left Sidebar: Active Chat Sessions */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 font-extrabold text-xs uppercase text-slate-400 tracking-wider">
            Conversations ({sessions.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-bold">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-700 mb-1" />
                Loading Chat Sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                No customer chat sessions found.
              </div>
            ) : (
              sessions.map((sess) => {
                const isSelected = sess.session_id === selectedSessionId;
                return (
                  <div
                    key={sess.session_id}
                    onClick={() => setSelectedSessionId(sess.session_id)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <User className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                        <span className="font-bold text-xs truncate">{sess.sender_name}</span>
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {sess.last_message}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold block ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                        {new Date(sess.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.session_id);
                        }}
                        title="Delete Chat Session & Document Logs"
                        className={`mt-1 p-1 rounded-md transition-colors ${
                          isSelected ? "hover:bg-slate-800 text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Chat Thread & Reply Form */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white">
          {selectedSessionId ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-700" />
                    <span>Session: #{selectedSessionId}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Messages sync in real-time between customer website widget and admin panel.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteSession(selectedSessionId)}
                  className="text-xs font-bold gap-1 text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Chat & Document</span>
                </Button>
              </div>

              {/* Messages History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {activeMessages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 font-bold">
                    No messages in this chat thread yet.
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    const isAi = msg.sender === "ai";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                          {msg.sender_name} ({msg.sender}) • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-emerald-700 text-white rounded-br-xs shadow-xs font-semibold"
                              : isAi
                              ? "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-xs font-medium"
                              : "bg-slate-900 text-white rounded-bl-xs font-semibold"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin Live Reply Form */}
              <form onSubmit={handleSendAdminReply} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white">
                <input
                  type="text"
                  placeholder="Type live admin reply to customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
                />
                <Button type="submit" size="sm" className="font-bold text-xs rounded-xl h-9 px-4 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
                  <span>Send Reply</span>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 font-bold text-xs">
              Select a customer chat session from the list on the left to start live chatting.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
