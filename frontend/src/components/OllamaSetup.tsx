import React, { useState } from 'react'
import type { LlmSuggestion } from './LlmSuggestions'

interface InstallingStatus {
  status: string;
  percentage: number;
  message: string;
}

interface OllamaSetupProps {
  model: LlmSuggestion;
  allModels: LlmSuggestion[];
  onBack: () => void;
  onConfirm: (modelName: string) => void;
  onCancel: () => void;
  installingStatus: InstallingStatus | null;
}

const ALL_AVAILABLE_MODELS: LlmSuggestion[] = [
  {
    name: "Qwen 2.5 0.5B (Q4_K_M)",
    size: "0.39 GB",
    description: "Extremely lightweight model optimized for low-memory CPU/GPU devices.",
    gpu_accel: "Supported (CPU Fallback)"
  },
  {
    name: "Llama 3.2 1B (Q4_K_M)",
    size: "0.78 GB",
    description: "Meta's compact model for rapid text processing and low latency.",
    gpu_accel: "Supported"
  },
  {
    name: "SmolLM2 1.7B (Q4_K_M)",
    size: "1.20 GB",
    description: "Curated dataset small language model with crisp responses.",
    gpu_accel: "Supported"
  },
  {
    name: "Gemma 2 2B (Q4_K_M)",
    size: "1.65 GB",
    description: "Google's lightweight model with strong reasoning logic.",
    gpu_accel: "Supported"
  },
  {
    name: "Llama 3.2 3B (Q4_K_M)",
    size: "2.00 GB",
    description: "Meta's standard lightweight model for everyday assistant workloads.",
    gpu_accel: "Supported"
  },
  {
    name: "Mistral 7B (Q4_K_M)",
    size: "4.10 GB",
    description: "Popular balanced open weights model for complex conversations.",
    gpu_accel: "Supported"
  },
  {
    name: "Llama 3 8B (Q4_K_M)",
    size: "4.70 GB",
    description: "High-capability instruction-tuned general assistant model.",
    gpu_accel: "Supported"
  },
  {
    name: "Qwen 2.5 7B (Q4_K_M)",
    size: "4.70 GB",
    description: "Top-tier open model for coding and multilingual tasks.",
    gpu_accel: "Supported"
  }
]

export const OllamaSetup: React.FC<OllamaSetupProps> = ({
  model,
  allModels: _allModels,
  onBack,
  onConfirm,
  onCancel,
  installingStatus
}) => {
  const [selectedModelName, setSelectedModelName] = useState(model.name)

  const currentModel = ALL_AVAILABLE_MODELS.find(m => m.name === selectedModelName) || model

  if (installingStatus) {
    const isInstalling = installingStatus.status === 'installing';
    const isDownloading = installingStatus.status === 'downloading';
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4 w-full max-w-xl text-left font-['Clash_Display',sans-serif] text-black">
        <div className="bg-white border border-[#bdbdbd] rounded-2xl p-8 w-full shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            {isInstalling ? "Environment Preparation" : isDownloading ? "Downloading Model Weights" : "Setup in Progress"}
          </span>
          <h2 className="text-2xl font-bold text-black mt-1 mb-6">
            {isInstalling ? "Configuring Ollama..." : `Pulling ${currentModel.name}`}
          </h2>

          <div className="space-y-6">
            {/* Progress status */}
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-neutral-600 uppercase">{installingStatus.status}</span>
              <span className="text-black font-mono">{installingStatus.percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#faf5ea] border border-[#bdbdbd] rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-black h-full transition-all duration-300 rounded-full"
                style={{ width: `${installingStatus.percentage}%` }}
              />
            </div>

            {/* Console output */}
            <div className="bg-[#faf5ea] border border-[#bdbdbd] rounded-xl p-3.5 font-mono text-xs text-neutral-700 min-h-[70px] max-h-[120px] overflow-y-auto break-all">
              <span className="text-neutral-400 font-bold mr-1.5">&gt;</span>
              {installingStatus.message}
            </div>

            {/* Cancel Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onCancel}
                className="bg-white hover:bg-neutral-100 text-red-600 border border-red-200 rounded-xl px-4 py-2 text-xs font-medium transition-all active:scale-95"
              >
                Cancel Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4 w-full max-w-xl text-left font-['Clash_Display',sans-serif] text-black">
      {/* Back button */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={onBack}
          className="text-neutral-600 hover:text-black flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recommendations
        </button>
      </div>

      <div className="bg-white border border-[#bdbdbd] rounded-2xl p-8 w-full shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Model Setup & Verification
        </span>
        <h2 className="text-2xl font-bold text-black mt-1 mb-4">
          Configure {currentModel.name}
        </h2>
        <p className="text-neutral-600 text-xs mb-6 font-sans">
          This model will be downloaded to your local Ollama environment for private inference.
        </p>

        {/* Dropdown Selector */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 block mb-2">
            Model Variant
          </label>
          <select
            value={selectedModelName}
            onChange={(e) => setSelectedModelName(e.target.value)}
            className="w-full bg-[#faf5ea] border border-[#bdbdbd] rounded-xl p-3 text-black text-xs font-medium outline-none focus:border-black transition-all"
          >
            {ALL_AVAILABLE_MODELS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} [{m.size}]
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => onConfirm(selectedModelName)}
            className="bg-black hover:bg-neutral-800 text-white rounded-xl px-6 py-3 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            Confirm & Initialize
          </button>
        </div>
      </div>
    </div>
  )
}
