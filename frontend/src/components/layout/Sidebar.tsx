import React from 'react'

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  onNavigate: (page: 'home' | 'recommendations' | 'byok' | 'dashboard') => void;
  username: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat?: () => void;
  chatSessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  username,
  isOpen,
  onToggle,
  onNewChat,
  chatSessions = [],
  activeSessionId,
  onSelectSession,
}) => {
  const handleStartNewChat = () => {
    onNavigate('home');
    if (onNewChat) {
      onNewChat();
    }
  };

  // Collapsed Mini Sidebar View
  if (!isOpen) {
    return (
      <div className="h-screen w-14 flex flex-col justify-between items-center py-3 bg-[#faf5ea] border-r border-[#bdbdbd] shrink-0 transition-all duration-300 font-['Clash_Display',sans-serif]">
        <div className="flex flex-col items-center w-full gap-4">
          {/* Header Toggle */}
          <button
            onClick={onToggle}
            className="p-2 text-neutral-600 hover:text-black rounded-lg transition-all"
            title="Expand Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* New Chat Icon */}
          <button
            onClick={handleStartNewChat}
            className="w-9 h-9 rounded-lg border border-[#bdbdbd] hover:border-black flex items-center justify-center text-black bg-white hover:bg-[#faf5ea] transition-all"
            title="New Chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          </button>
        </div>

        {/* User Avatar */}
        <div className="relative cursor-pointer" onClick={() => onNavigate('dashboard')} title="System Specs / Profile">
          <img
            src="/assets/profile/profile-1.jpg"
            alt={username || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-[#bdbdbd]"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  // Expanded Sidebar View
  return (
    <div className="h-screen w-64 flex flex-col justify-between bg-[#faf5ea] border-r border-[#bdbdbd] shrink-0 transition-all duration-300 overflow-hidden font-['Clash_Display',sans-serif]">
      <div className="flex flex-col w-64 flex-1 min-h-0">
        {/* Header containing Brand and Collapse Button */}
        <div className="p-4 flex items-center justify-between border-b border-[#bdbdbd]/40 h-16 shrink-0">
          <span className="font-semibold text-black text-xl tracking-tight select-none font-['Clash_Display',sans-serif]">
            Zyros
          </span>
          
          <button
            onClick={onToggle}
            className="p-1.5 text-neutral-500 hover:text-black rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center gap-2.5 rounded-lg border border-[#bdbdbd] bg-white hover:bg-neutral-50 text-black px-3.5 py-2.5 text-xs font-medium transition-all shadow-sm active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0 space-y-1">
          <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 select-none">
            Recent Chats
          </div>
          {chatSessions.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-neutral-400">
              No recent conversations
            </div>
          ) : (
            chatSessions.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  if (onSelectSession) {
                    onSelectSession(chat.id);
                  }
                  onNavigate('home');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                  activeSessionId === chat.id
                    ? 'bg-white border border-[#bdbdbd] text-black font-medium shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-white/60 border border-transparent'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate flex-1 font-sans">{chat.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* User Info & Settings Footer */}
      <div className="p-3 border-t border-[#bdbdbd]/40 w-64 shrink-0 bg-[#faf5ea]">
        <div className="px-3 py-2.5 flex items-center justify-between bg-white border border-[#bdbdbd] rounded-xl select-none shadow-sm">
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            onClick={() => onNavigate('dashboard')}
            title="View Specifications & Settings"
          >
            <img
              src="/assets/profile/profile-1.jpg"
              alt="User Avatar"
              className="w-7 h-7 rounded-full object-cover border border-[#bdbdbd] shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-black truncate capitalize leading-tight">
                {username || 'Zyros User'}
              </p>
              <p className="text-[10px] text-neutral-500 truncate leading-tight">Developer</p>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-1 text-neutral-400 hover:text-black transition-colors shrink-0"
            title="System Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
