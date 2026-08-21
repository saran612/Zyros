import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Send, RefreshCw, Cpu, ShieldAlert, Sparkles, TerminalSquare } from 'lucide-react';

interface LogMessage {
  id: string;
  sender: 'user' | 'zyros';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export default function Terminal() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<LogMessage[]>([
    {
      id: 'welcome',
      sender: 'zyros',
      text: "Welcome to Zyros Operations Assistant. Type your request or select one of the diagnostics below.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI_METADATA__' in window);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = (customQuery || query).trim();
    if (!activeQuery || loading) return;

    if (!customQuery) {
      setQuery('');
    }

    const userMsgId = Math.random().toString(36).substring(7);
    const userMessage: LogMessage = {
      id: userMsgId,
      sender: 'user',
      text: activeQuery,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      let response = '';
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/tauri');
        response = await invoke<string>('ask_zyros', { query: activeQuery });
      } else {
        // Mock response for web preview
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (activeQuery.toLowerCase().includes('ram') || activeQuery.toLowerCase().includes('memory')) {
          response = "📊 Memory Usage Diagnostic:\n\nRan command: `cat /proc/meminfo`\n\n```\nMemTotal:       16345672 kB\nMemFree:         4123544 kB\nMemAvailable:    8931204 kB\nBuffers:          345620 kB\nCached:          4561230 kB\n```\n\n**Zyros Analysis:** Your system has approximately 8.5 GB of memory available (54% active usage). There are no memory exhaustion flags detected in your system journal.";
        } else if (activeQuery.toLowerCase().includes('ping') || activeQuery.toLowerCase().includes('network')) {
          response = "🌐 Network Latency Diagnostic:\n\nRan command: `ping -c 3 8.8.8.8`\n\n```\nPING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.4 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.8 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=14.1 ms\n\n--- 8.8.8.8 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 11.821/12.774/14.112/0.972 ms\n```\n\n**Zyros Analysis:** The network diagnostic completed successfully with 0% packet loss and an average latency of 12.77ms. Connection to host is stable.";
        } else {
          response = `Executed request: "${activeQuery}"\n\nCommand output diagnostic simulated. Your Tauri backend is operational!`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'zyros',
          text: response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'zyros',
          text: `Error executing command: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    handleSubmit(undefined, text);
  };

  const suggestions = [
    "Check system memory usage",
    "Run network ping latency check",
    "List active system services",
  ];

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans border border-white/10">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/25">
            <TermIcon className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
              Zyros Dashboard
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                Daemon Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Desktop Linux AI Assistant & Diagnostic Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu size={14} className="text-slate-500" />
            <span className="font-mono">Allowed: systemctl, uname, cat, ip, ping, nmcli, ls</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Feed */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/80 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              {msg.sender === 'zyros' ? (
                <>
                  <Sparkles size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Zyros</span>
                </>
              ) : (
                <>
                  <TerminalSquare size={12} className="text-pink-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">User Command</span>
                </>
              )}
              <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl border text-sm shadow-md whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-pink-600/10 to-indigo-600/10 border-indigo-500/30 text-slate-100 rounded-tr-none'
                  : msg.isError
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200 rounded-tl-none'
                  : 'bg-slate-900/60 border-white/5 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col mr-auto items-start max-w-[85%]">
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <RefreshCw size={12} className="text-indigo-400 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Zyros is thinking...</span>
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none border border-white/5 bg-slate-900/40 text-slate-400 flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-mono">Running local system operation...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Suggested Prompts */}
      {messages.length === 1 && !loading && (
        <div className="px-6 py-3 bg-slate-900/20 border-t border-white/5 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
            <ShieldAlert size={12} className="text-indigo-400" /> Suggestions:
          </span>
          {suggestions.map((text, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestion(text)}
              className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input Prompt bar */}
      <footer className="p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask to run system commands, diagnose services or show logs..."
            disabled={loading}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 text-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl px-5 py-3 flex items-center gap-2 cursor-pointer transition-colors shadow-lg disabled:cursor-not-allowed"
          >
            <span className="text-sm">Run</span>
            <Send size={14} />
          </button>
        </form>
      </footer>
    </div>
  );
}
