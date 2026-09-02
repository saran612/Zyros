import React, { useState, useRef, useEffect } from 'react'

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

interface HomeProps {
  currentSessionId?: string;
  onSessionUpdated?: (session: ChatSession) => void;
  activeModel?: string;
  provider?: string;
}

const API_BASE = 'http://localhost:8008';

const GREETING_PHRASES = [
  "Ready?",
  "What's next?",
  "Let's go.",
  "Hello.",
  "Need help?",
  "Build it.",
  "Let's work.",
  "How can I help you today?"
];

export const Home: React.FC<HomeProps> = ({
  currentSessionId,
  onSessionUpdated,
  activeModel,
  provider
}) => {
  const [sessionId, setSessionId] = useState<string>(currentSessionId || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [greetingText, setGreetingText] = useState("How can I help you?")
  const [activeMode, setActiveMode] = useState<'chat' | 'ops'>('chat')
  const [effortLevel, setEffortLevel] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [showEffortMenu, setShowEffortMenu] = useState(false)
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if we should show welcome splash briefly
    const seen = sessionStorage.getItem('zyros_welcome_shown')
    if (!seen) {
      setShowWelcomeOverlay(true)
      sessionStorage.setItem('zyros_welcome_shown', 'true')
      const timer = setTimeout(() => {
        setShowWelcomeOverlay(false)
      }, 1600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    setGreetingText(GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load session when currentSessionId prop changes
  useEffect(() => {
    if (currentSessionId) {
      setSessionId(currentSessionId)
      fetch(`${API_BASE}/chat/sessions/${currentSessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load session');
          return res.json() as Promise<ChatSession>;
        })
        .then((session) => {
          setMessages(session.messages || []);
        })
        .catch(() => {
          setMessages([]);
        });
    } else {
      setSessionId(`sess_${Date.now()}`);
      setMessages([]);
    }
  }, [currentSessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isTyping) return

    const activeSessId = sessionId || `sess_${Date.now()}`
    if (!sessionId) {
      setSessionId(activeSessId)
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch(`${API_BASE}/chat/sessions/${activeSessId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from server')
      }

      const data = await response.json() as { session: ChatSession; reply: Message }
      setMessages(data.session.messages)
      if (onSessionUpdated) {
        onSessionUpdated(data.session)
      }
    } catch (err) {
      console.error('Chat error:', err)
      const fallbackReply: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: `Error reaching Zyros backend. Please make sure the local server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, fallbackReply])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-[#faf5ea] text-black overflow-hidden font-['Clash_Display',sans-serif]">
      {/* Welcome Animated Intro Overlay from opsy */}
      {showWelcomeOverlay && (
        <div className="absolute inset-0 z-50 bg-[#faf5ea] flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none">
          <img src="/assets/images/logo.png" alt="Zyros" className="w-16 h-16 mb-4 object-contain animate-bounce" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">Welcome to Zyros</h1>
        </div>
      )}

      {/* Top Bar with Mode Switcher */}
      <div className="w-full flex justify-center items-center py-4 z-10 shrink-0">
        <div className="inline-flex p-1 bg-white/70 border border-[#bdbdbd]/60 rounded-full shadow-sm">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
              activeMode === 'chat'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveMode('ops')}
            className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium transition-all ${
              activeMode === 'ops'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            Ops
          </button>
        </div>
      </div>

      {/* Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-2 w-full max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none animate-fadeIn">
            <img
              src="/assets/images/logo.png"
              alt="Zyros"
              className="w-14 h-14 mb-4 object-contain opacity-90"
            />
            <h2 className="text-3xl sm:text-4xl font-normal text-black font-['Playfair_Display',serif] tracking-tight">
              {greetingText}
            </h2>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed transition-all shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-[#bdbdbd]/80 text-black rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans text-[13.5px]">{msg.text}</p>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3.5 max-w-[80px] bg-white border border-[#bdbdbd]/80 rounded-2xl rounded-tl-sm shadow-sm">
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input Bar & Model Controls */}
      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto shrink-0">
        <div className="bg-white border border-[#bdbdbd] rounded-2xl p-2 shadow-sm transition-all focus-within:border-black focus-within:shadow-md">
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Zyros..."
              className="flex-1 bg-transparent py-2 text-sm text-black placeholder-neutral-400 focus:outline-none font-sans"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 rounded-full bg-black text-white hover:opacity-85 disabled:opacity-30 flex items-center justify-center transition-all shrink-0 active:scale-95"
              title="Send message"
            >
              <img src="/assets/icons/send.png" alt="Send" className="w-3.5 h-3.5 filter invert" />
            </button>
          </form>

          {/* Model Status and Effort Selectors */}
          <div className="flex justify-between items-center px-3 pt-2 pb-1 border-t border-neutral-100 mt-1">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-[#faf5ea] border border-[#bdbdbd]/70 rounded-full px-3 py-1 text-[11px] font-medium text-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{provider ? provider.toUpperCase() : 'LOCAL'}</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#faf5ea] border border-[#bdbdbd]/70 rounded-full px-3 py-1 text-[11px] font-medium text-neutral-800">
                <span>{activeModel || 'Zyros Core'}</span>
              </div>
            </div>

            {/* Effort Selector Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEffortMenu(!showEffortMenu)}
                className="inline-flex items-center gap-1 bg-[#faf5ea] hover:bg-neutral-200/60 border border-[#bdbdbd]/70 rounded-full px-3 py-1 text-[11px] font-medium text-neutral-800 transition-colors"
              >
                <span>Effort: {effortLevel}</span>
                <svg className="w-3 h-3 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {showEffortMenu && (
                <div className="absolute right-0 bottom-8 bg-white border border-[#bdbdbd] rounded-lg shadow-xl py-1 w-28 z-20 overflow-hidden">
                  {(['Low', 'Medium', 'High'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setEffortLevel(level)
                        setShowEffortMenu(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#faf5ea] transition-colors ${
                        effortLevel === level ? 'font-semibold text-black bg-[#faf5ea]/50' : 'text-neutral-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
