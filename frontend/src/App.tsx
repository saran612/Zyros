import { useEffect, useState } from 'react'
import './index.css'
import { Onboarding } from './components/Onboarding'
import type { SystemSpecs } from './components/SystemSpecification'
import { LlmSuggestions } from './components/LlmSuggestions'
import type { LlmSuggestion } from './components/LlmSuggestions'
import { ByokConfiguration } from './components/ByokConfiguration'
import { OllamaSetup } from './components/OllamaSetup'
import { SystemSpecification } from './components/SystemSpecification'
import { Home } from './components/Home'
import { Sidebar } from './components/layout/Sidebar'

const API_BASE = 'http://localhost:8008'

interface ApiKeyConfig {
  provider: string;
  key: string;
}

interface UserData {
  onboarded: boolean;
  username: string;
  system_specs: SystemSpecs | null;
  suggestions: LlmSuggestion[];
  api_key: ApiKeyConfig | null;
  active_model: string | null;
}

interface InstallingStatus {
  status: string;
  percentage: number;
  message: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  created_at: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const [onboarded, setOnboarded] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null)
  const [suggestions, setSuggestions] = useState<LlmSuggestion[]>([])
  
  const [activePage, setActivePage] = useState<'recommendations' | 'byok' | 'ollama' | 'dashboard' | 'home'>('recommendations')
  const [selectedModel, setSelectedModel] = useState<LlmSuggestion | null>(null)
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("zyros_api_key") || "")
  const [provider, setProvider] = useState<string>(() => localStorage.getItem("zyros_api_provider") || "openai")
  const [activeModel, setActiveModel] = useState<string>('')

  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Real-time progress updates state
  const [installingStatus, setInstallingStatus] = useState<InstallingStatus | null>(null)
  const [activeEventSource, setActiveEventSource] = useState<EventSource | null>(null)

  const loadChatSessions = () => {
    fetch(`${API_BASE}/chat/sessions`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json() as Promise<ChatSessionItem[]>;
      })
      .then((sessions) => {
        setChatSessions(sessions || []);
        if (sessions && sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(sessions[0].id);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadChatSessions();
  }, [])

  // Check onboarding status on load
  useEffect(() => {
    fetch(`${API_BASE}/onboard/status`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not fetch onboarding status')
        return res.json() as Promise<UserData>
      })
      .then((data) => {
        setOnboarded(data.onboarded)
        if (data.onboarded) {
          setUsername(data.username || '')
          setSystemSpecs(data.system_specs || null)
          setSuggestions(data.suggestions || [])
          
          if (data.api_key) {
            setApiKey(data.api_key.key)
            setProvider(data.api_key.provider)
            localStorage.setItem("zyros_api_key", data.api_key.key)
            localStorage.setItem("zyros_api_provider", data.api_key.provider)
          } else {
            setApiKey("")
          }

          if (data.active_model) {
            setActiveModel(data.active_model)
          } else {
            setActiveModel("")
          }

          // Route to home if fully setup
          if (data.api_key || data.active_model) {
            setActivePage('home')
          } else {
            setActivePage('recommendations')
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        setErrorMsg(`Initialization Error: ${err.message}`)
        setLoading(false)
      })
  }, [])

  const handleOnboard = () => {
    setSubmitting(true)
    setErrorMsg('')

    fetch(`${API_BASE}/onboard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Onboarding onboarding request failed')
        return res.json() as Promise<UserData>
      })
      .then((data) => {
        setOnboarded(data.onboarded)
        setUsername(data.username || '')
        setSystemSpecs(data.system_specs || null)
        setSuggestions(data.suggestions || [])
        setSubmitting(false)
        setActivePage('recommendations')
      })
      .catch((err) => {
        setErrorMsg(`Onboarding Error: ${err.message}`)
        setSubmitting(false)
      })
  }

  const handleSaveApiKey = (newProvider: string, newKey: string) => {
    return fetch(`${API_BASE}/onboard/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: newProvider, key: newKey })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to save API key to backend')
        setApiKey(newKey)
        setProvider(newProvider)
        setActiveModel('') // reset local model since switched to cloud
        localStorage.setItem("zyros_api_key", newKey)
        localStorage.setItem("zyros_api_provider", newProvider)
        setTimeout(() => {
          setActivePage('home')
        }, 800)
      })
  }

  const handleSelectModel = (model: LlmSuggestion) => {
    setSelectedModel(model)
    setActivePage('ollama')
  }

  const handleConfirmModel = (modelName: string) => {
    // Close any previous EventSource safely
    if (activeEventSource) {
      activeEventSource.close()
    }

    setInstallingStatus({
      status: 'checking',
      percentage: 0,
      message: 'Checking dependencies...'
    })

    const es = new EventSource(`${API_BASE}/onboard/run-model-stream?model=${encodeURIComponent(modelName)}`)
    setActiveEventSource(es)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as InstallingStatus
        setInstallingStatus(data)

        if (data.status === 'completed') {
          es.close()
          setActiveEventSource(null)
          setActiveModel(modelName)
          setApiKey('') // reset cloud BYOK since switched to local
          localStorage.removeItem("zyros_api_key")
          
          setTimeout(() => {
            setInstallingStatus(null)
            setActivePage('home')
          }, 1500)
        } else if (data.status === 'failed') {
          es.close()
          setActiveEventSource(null)
        }
      } catch (err) {
        console.error("Stream parse error:", err)
      }
    }

    es.onerror = () => {
      es.close()
      setActiveEventSource(null)
      setInstallingStatus({
        status: 'failed',
        percentage: 0,
        message: 'Streaming connection failed or was interrupted.'
      })
    }
  }

  const handleCancelInstall = () => {
    if (activeEventSource) {
      activeEventSource.close()
      setActiveEventSource(null)
    }

    fetch(`${API_BASE}/onboard/cancel-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to abort operation on server')
        setInstallingStatus(null)
      })
      .catch((err) => {
        console.error("Failed to cancel on backend:", err)
        setInstallingStatus(null)
      })
  }

  if (loading) {
    return (
      <div id="center" className="flex items-center justify-center min-h-screen bg-[#faf5ea] font-['Clash_Display',sans-serif]">
        <div className="text-center flex flex-col items-center">
          <img src="/assets/images/logo.png" alt="Zyros" className="w-16 h-16 mb-4 object-contain animate-pulse" />
          <h1 className="text-3xl font-semibold tracking-tight text-black mb-2">Zyros</h1>
          <div className="text-neutral-500 font-medium text-sm">
            Initializing workspace...
          </div>
        </div>
      </div>
    )
  }

  if (!onboarded) {
    return (
      <div id="center" className="flex flex-col min-h-screen bg-[#faf5ea] text-black">
        <Onboarding
          submitting={submitting}
          errorMsg={errorMsg}
          onOnboard={handleOnboard}
        />
      </div>
    )
  }

  const handleNewChat = () => {
    const newId = `sess_${Date.now()}`;
    setActiveSessionId(newId);
    setActivePage('home');
  };

  return (
    <div className="flex h-screen w-full bg-[#faf5ea] text-black overflow-hidden font-['Clash_Display',sans-serif]">
      {/* Navigation Sidebar */}
      <Sidebar
        onNavigate={(page) => setActivePage(page)}
        username={username}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActivePage('home');
        }}
      />

      {/* Content Canvas */}
      <div className={`flex-1 h-full flex flex-col items-center w-full relative bg-[#faf5ea] ${
        activePage === 'home' ? 'p-0 overflow-hidden' : 'py-6 pb-16 px-4 overflow-y-auto'
      }`}>
        <div className={`w-full flex justify-center ${activePage === 'home' ? 'h-full' : ''}`}>
          {activePage === 'home' ? (
            <Home
              currentSessionId={activeSessionId}
              onSessionUpdated={(_session) => {
                loadChatSessions();
              }}
              activeModel={activeModel}
              provider={provider}
            />
          ) : activePage === 'dashboard' ? (
            <SystemSpecification
              username={username}
              systemSpecs={systemSpecs}
              activeModel={activeModel}
              apiKey={apiKey}
              provider={provider}
              onChangeConfig={() => setActivePage('recommendations')}
            />
          ) : activePage === 'recommendations' ? (
            <LlmSuggestions
              suggestions={suggestions}
              onGoToByok={() => setActivePage('byok')}
              onSelectModel={handleSelectModel}
              hasApiKeyConfigured={!!apiKey}
            />
          ) : activePage === 'byok' ? (
            <ByokConfiguration
              initialApiKey={apiKey}
              initialProvider={provider}
              onBack={() => {
                setActivePage('recommendations')
              }}
              onSave={handleSaveApiKey}
            />
          ) : (
            selectedModel && (
              <OllamaSetup
                model={selectedModel}
                allModels={suggestions}
                onBack={() => {
                  setActivePage('recommendations')
                }}
                onConfirm={handleConfirmModel}
                onCancel={handleCancelInstall}
                installingStatus={installingStatus}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default App
