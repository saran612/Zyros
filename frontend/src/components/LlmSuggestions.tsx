import React, { useState } from 'react'

interface LlmSuggestion {
  name: string;
  size: string;
  description: string;
  gpu_accel: string;
}

interface LlmSuggestionsProps {
  suggestions: LlmSuggestion[];
  onGoToByok: () => void;
  onSelectModel: (model: LlmSuggestion) => void;
  hasApiKeyConfigured: boolean;
}

export type { LlmSuggestion };

export const LlmSuggestions: React.FC<LlmSuggestionsProps> = ({
  suggestions,
  onGoToByok,
  onSelectModel,
  hasApiKeyConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local')

  return (
    <div className="w-full max-w-3xl py-8 px-4 text-left font-['Clash_Display',sans-serif] text-black">
      {/* Brand & Heading */}
      <div className="flex flex-col items-center mb-6 text-center select-none">
        <img src="/assets/images/logo.png" alt="Zyros" className="w-14 h-14 mb-2 object-contain" />
        <h1 className="text-3xl font-semibold text-black tracking-tight">Configure Your Model</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Choose a recommended local open-weight model or configure cloud API access
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-white border border-[#bdbdbd] rounded-full shadow-sm">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'local'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Local Models
          </button>
          <button
            onClick={() => {
              setActiveTab('cloud')
              onGoToByok()
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'cloud'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Cloud Models (BYOK)
          </button>
        </div>
      </div>

      {/* Local Model Cards list matching opsy setup */}
      <div className="bg-white border border-[#bdbdbd] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Recommended for your Hardware
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            {suggestions.length} available
          </span>
        </div>

        <div className="space-y-3">
          {suggestions.map((model, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 border border-[#bdbdbd] hover:border-black rounded-xl bg-transparent transition-all group"
            >
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-black">{model.name}</span>
                  <span className="text-[10px] font-medium bg-[#faf5ea] border border-[#bdbdbd]/80 px-2 py-0.5 rounded-full text-neutral-700">
                    {model.size}
                  </span>
                </div>
                <p className="text-neutral-600 text-xs mt-1 font-sans line-clamp-1">
                  {model.description}
                </p>
              </div>

              <button
                onClick={() => onSelectModel(model)}
                className="bg-transparent hover:bg-black hover:text-white text-black border border-[#bdbdbd] hover:border-black rounded-full px-4 py-1.5 text-xs font-medium transition-all shrink-0 active:scale-95"
              >
                Configure
              </button>
            </div>
          ))}
        </div>

        {/* Footer info link */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            onClick={onGoToByok}
            className="text-xs text-neutral-600 hover:text-black font-medium underline transition-colors"
          >
            {hasApiKeyConfigured ? 'Change Cloud API Key' : 'Prefer to use OpenAI / Claude / Gemini API?'}
          </button>
        </div>
      </div>
    </div>
  )
}
