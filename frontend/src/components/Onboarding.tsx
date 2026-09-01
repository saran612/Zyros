import React, { useState } from 'react'

interface OnboardingProps {
  submitting: boolean;
  errorMsg: string;
  onOnboard: () => void;
}

const ROLES = [
  { id: 'developer', label: 'Developer' },
  { id: 'sysadmin', label: 'Sysadmin' },
  { id: 'homelab', label: 'Homelab / Self-hoster' },
  { id: 'student', label: 'Student' },
  { id: 'desktop-user', label: 'Just a regular desktop user' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ submitting, errorMsg, onOnboard }) => {
  const [selectedRole, setSelectedRole] = useState('developer')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const activeRoleLabel = ROLES.find(r => r.id === selectedRole)?.label || 'Developer'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf5ea] text-black px-4 font-['Clash_Display',sans-serif]">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 select-none">
        <img src="/assets/images/logo.png" alt="Zyros" className="w-16 h-16 mb-2 object-contain" />
        <h1 className="text-3xl font-bold tracking-tight text-black">Zyros</h1>
      </div>

      <div className="bg-white border border-[#bdbdbd] rounded-2xl p-8 max-w-lg w-full shadow-md text-left transition-all">
        <h2 className="text-2xl font-semibold text-black mb-2">Welcome! Let's get you started</h2>
        <p className="text-neutral-600 text-sm mb-6">
          Set up your workstation profile once to personalize your local LLM co-pilot experience.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Role Selection Dropdown */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
            Primary Role / Workflow
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#faf5ea] border border-[#bdbdbd] rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-black transition-colors"
            >
              <span>{activeRoleLabel}</span>
              <svg className={`w-4 h-4 text-neutral-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#bdbdbd] rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#faf5ea] transition-colors ${
                      selectedRole === role.id ? 'font-semibold bg-[#faf5ea]/60' : 'text-neutral-700'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onOnboard}
          disabled={submitting}
          className="w-full bg-black hover:bg-neutral-800 text-white rounded-xl py-3.5 font-medium text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Scanning System Hardware...</span>
            </>
          ) : (
            'Continue to Setup'
          )}
        </button>
      </div>
    </div>
  )
}
