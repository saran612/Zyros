import React, { useState } from 'react'

interface ByokConfigurationProps {
  initialApiKey: string;
  initialProvider: string;
  onBack: () => void;
  onSave: (provider: string, key: string) => void;
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'groq', label: 'Groq' },
];

export const ByokConfiguration: React.FC<ByokConfigurationProps> = ({
  initialApiKey,
  initialProvider,
  onBack,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [provider, setProvider] = useState(initialProvider || 'openai')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const selectedProviderLabel = PROVIDERS.find(p => p.id === provider)?.label || 'OpenAI'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!apiKey.trim()) {
      setErrorMsg('Please enter an API key.')
      return
    }

    setIsVerifying(true)
    try {
      await onSave(provider, apiKey.trim())
      setIsSuccess(true)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="w-full max-w-lg py-8 px-4 text-left font-['Clash_Display',sans-serif] text-black">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Local Models
        </button>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center select-none">
        <img src="/assets/images/logo.png" alt="Zyros" className="w-14 h-14 mb-2 object-contain" />
        <h1 className="text-2xl font-semibold text-black tracking-tight">Cloud Provider Setup</h1>
        <p className="text-neutral-600 text-xs mt-1">
          Bring your own API key for cloud model inference
        </p>
      </div>

      <div className="bg-white border border-[#bdbdbd] rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Provider Selection */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-black">Select Provider</label>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 bg-transparent border border-[#bdbdbd] rounded-lg px-3.5 py-2 text-xs font-medium text-black min-w-[140px] focus:outline-none"
              >
                <span>{selectedProviderLabel}</span>
                <svg className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#bdbdbd] rounded-lg shadow-lg z-20 overflow-hidden py-1 min-w-[140px]">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProvider(p.id)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-[#faf5ea] transition-colors ${
                        provider === p.id ? 'font-semibold bg-[#faf5ea]/60' : 'text-neutral-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-transparent border border-[#bdbdbd] focus:border-black rounded-lg px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="bg-black hover:bg-neutral-800 text-white rounded-lg px-5 py-2.5 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isVerifying ? 'Saving…' : 'Save & Verify'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-red-600 text-xs font-sans mt-2">{errorMsg}</p>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium text-center">
              Setup complete — credentials saved!
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
