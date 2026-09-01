import React from 'react'

interface CpuInfo {
  model_name: string;
  physical_cores: number;
  logical_cores: number;
}

interface MemoryInfo {
  total_gb: number;
  free_gb: number;
}

interface DiskInfo {
  total_gb: number;
  available_gb: number;
}

interface GpuInfo {
  name: string;
  vendor: string;
}

interface OsInfo {
  kernel: string;
  distro: string;
  uts_version: string;
}

interface SystemSpecs {
  cpu: CpuInfo;
  ram: MemoryInfo;
  disk: DiskInfo;
  gpus: GpuInfo[];
  os?: OsInfo;
}

export type { SystemSpecs, CpuInfo, MemoryInfo, DiskInfo, GpuInfo };

interface SystemSpecificationProps {
  username: string;
  systemSpecs: SystemSpecs | null;
  activeModel: string | null;
  apiKey: string | null;
  provider: string | null;
  onChangeConfig: () => void;
}

export const SystemSpecification: React.FC<SystemSpecificationProps> = ({
  username,
  systemSpecs,
  activeModel,
  apiKey,
  provider,
  onChangeConfig,
}) => {
  const ramUsed = systemSpecs ? (systemSpecs.ram.total_gb - systemSpecs.ram.free_gb).toFixed(1) : '—';
  const ramTotal = systemSpecs ? systemSpecs.ram.total_gb.toFixed(1) : '—';
  const diskFree = systemSpecs ? systemSpecs.disk.available_gb.toFixed(1) : '—';
  const diskTotal = systemSpecs ? systemSpecs.disk.total_gb.toFixed(1) : '—';

  return (
    <div className="w-full max-w-4xl py-6 px-4 text-left space-y-6 animate-fadeIn font-['Clash_Display',sans-serif] text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#bdbdbd]">
        <div className="flex items-center gap-4">
          <img
            src="/assets/profile/profile-1.jpg"
            alt={username}
            className="w-14 h-14 rounded-full object-cover border-2 border-[#bdbdbd] shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">System Specification</h1>
            <p className="text-neutral-600 text-xs mt-0.5">
              Workstation profile for <span className="text-black font-semibold">{username || 'User'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onChangeConfig}
          className="text-xs bg-black hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          Reconfigure Model / Keys
        </button>
      </div>

      {/* Active Model / Config Card */}
      <div className="bg-white border border-[#bdbdbd] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Active Intelligence Engine</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>

        {activeModel ? (
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-[#faf5ea] border border-[#bdbdbd] flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">{activeModel}</h3>
              <p className="text-xs text-neutral-600">Local Inference Engine (Ollama / GGUF)</p>
            </div>
          </div>
        ) : apiKey ? (
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-[#faf5ea] border border-[#bdbdbd] flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h3 className="text-lg font-bold text-black capitalize">{provider} Cloud Provider</h3>
              <p className="text-xs text-neutral-600">API Key: ••••••••{apiKey.slice(-4)}</p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm mt-2">No active local model or cloud API configured.</p>
        )}
      </div>

      {/* Hardware Profile Cards matching Opsy Layout */}
      <div>
        <h2 className="text-base font-semibold text-black mb-3">Hardware Diagnostics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* OS Card */}
          <div className="bg-white border border-[#bdbdbd] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Platform</span>
            <div className="mt-3">
              <div className="text-xl font-bold text-black truncate">{systemSpecs?.os?.distro || 'Linux'}</div>
              <p className="text-[11px] text-neutral-500 mt-1 truncate">Kernel: {systemSpecs?.os?.kernel || 'Unknown'}</p>
            </div>
          </div>

          {/* CPU Card */}
          <div className="bg-white border border-[#bdbdbd] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Processor</span>
            <div className="mt-3">
              <div className="text-xl font-bold text-black">{systemSpecs?.cpu.physical_cores || '—'} Cores</div>
              <p className="text-[11px] text-neutral-500 mt-1 truncate" title={systemSpecs?.cpu.model_name}>
                {systemSpecs?.cpu.model_name || 'CPU'}
              </p>
            </div>
          </div>

          {/* RAM Card */}
          <div className="bg-white border border-[#bdbdbd] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Memory</span>
            <div className="mt-3">
              <div className="text-xl font-bold text-black">
                {ramUsed} <span className="text-xs font-normal text-neutral-500">/ {ramTotal} GB</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">System RAM</p>
            </div>
          </div>

          {/* Disk Card */}
          <div className="bg-white border border-[#bdbdbd] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Storage</span>
            <div className="mt-3">
              <div className="text-xl font-bold text-black">
                {diskFree} <span className="text-xs font-normal text-neutral-500">GB Free</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">{diskTotal} GB Total Disk</p>
            </div>
          </div>
        </div>

        {/* GPU Details if present */}
        {systemSpecs?.gpus && systemSpecs.gpus.length > 0 && (
          <div className="mt-4 bg-white border border-[#bdbdbd] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">Graphics Accelerator</span>
                <span className="text-sm font-bold text-black mt-1 block">{systemSpecs.gpus[0].name}</span>
                <span className="text-xs text-neutral-500">{systemSpecs.gpus[0].vendor}</span>
              </div>
              <span className="text-xs bg-[#faf5ea] border border-[#bdbdbd] px-3 py-1.5 rounded-full font-medium text-black">
                Hardware Accelerated
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
