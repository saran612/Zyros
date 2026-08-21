import { useEffect, useState } from 'react';
import { Cpu, Terminal, X, Zap } from 'lucide-react';

export default function Widget() {
  const [cpuUsage, setCpuUsage] = useState(24);
  const [ramUsage, setRamUsage] = useState(48);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI_METADATA__' in window);
    
    // Simulate real-time CPU/RAM fluctuating slightly
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 9) - 4)));
      setRamUsage((prev) => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 3) - 1)));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const closeWidget = async () => {
    if (isTauri) {
      const { appWindow } = await import('@tauri-apps/api/window');
      appWindow.hide();
    }
  };

  const openTerminal = async () => {
    if (isTauri) {
      const { WebviewWindow } = await import('@tauri-apps/api/window');
      const termWin = WebviewWindow.getByLabel('terminal');
      if (termWin) {
        termWin.show();
        termWin.setFocus();
      }
    } else {
      alert("Opening terminal view (simulated)...");
    }
  };

  return (
    <div className="w-[300px] h-[200px] p-4 glass rounded-2xl overflow-hidden flex flex-col justify-between text-slate-100 select-none shadow-2xl relative">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full pulse-ring" />
          <span className="font-semibold text-xs tracking-wider text-indigo-200 uppercase">Zyros Widget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={openTerminal} 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-100"
            title="Open Terminal"
          >
            <Terminal size={14} />
          </button>
          <button 
            onClick={closeWidget} 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-100"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 py-2">
        {/* CPU */}
        <div className="flex flex-col gap-1 glass-light p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">CPU</span>
            <Cpu size={12} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-white">{cpuUsage}</span>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="flex flex-col gap-1 glass-light p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">RAM</span>
            <Zap size={12} className="text-pink-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-white">{ramUsage}</span>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-pink-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${ramUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Launcher Bar */}
      <div 
        onClick={openTerminal}
        className="w-full glass-light hover:bg-white/5 border border-white/5 hover:border-white/10 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
      >
        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">Ask Zyros Anything...</span>
        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
          Ctrl+Shift+Z
        </span>
      </div>
    </div>
  );
}
