
import React, { useState, useEffect } from 'react';
import { Settings, BrainCircuit, Sparkles, Key, Shield, ShieldAlert, Mail, Send, AlertTriangle, X } from 'lucide-react';

interface LoadingSpinnerProps {
    apiSourceLog?: string;
    errorLogs?: string | null;
    onGoToApi?: () => void;
    onReport?: () => void;
    onCancel?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ apiSourceLog, errorLogs, onGoToApi, onReport, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Initializing AI Engine...");

  // Simulate realistic AI generation stages
  useEffect(() => {
    if (errorLogs) return; // Stop simulation if there's an error

    const startTime = Date.now();
    const duration = 8000; 

    const update = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 99);
      
      setProgress(p);

      if (p < 25) setCurrentStage("Analyzing content context...");
      else if (p < 50) setCurrentStage("Identifying key concepts...");
      else if (p < 75) setCurrentStage("Drafting assessment questions...");
      else if (p < 90) setCurrentStage("Generating logical distractors...");
      else setCurrentStage("Finalizing quiz structure...");

      if (p < 99) {
        requestAnimationFrame(update);
      }
    };

    const handle = requestAnimationFrame(update);
    return () => cancelAnimationFrame(handle);
  }, [errorLogs]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4" role="status" aria-live="polite">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="bg-zinc-900/50 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl border border-zinc-800 max-w-lg w-full text-center relative overflow-hidden transition-all duration-500">
        
        {/* Decorative Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${errorLogs ? 'via-red-600' : 'via-blue-900'} to-transparent opacity-50`}></div>
        
        {!errorLogs ? (
          <div className="animate-in fade-in duration-500">
            <div className="relative inline-block mb-10" aria-hidden="true">
              <div className="absolute -top-6 -left-8 text-blue-400/60 animate-twinkle" style={{ animationDelay: '0s' }}>
                  <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute top-1/3 -right-10 text-indigo-400/50 animate-twinkle" style={{ animationDelay: '1.2s' }}>
                  <Sparkles className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-4 -left-6 text-sky-300/60 animate-twinkle" style={{ animationDelay: '2.5s' }}>
                  <Sparkles className="w-4 h-4" />
              </div>

              <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_-10px_rgba(37,99,235,0.5)] transform rotate-3 transition-transform duration-1000 hover:rotate-0 relative z-10">
                <BrainCircuit className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-zinc-900 rounded-full p-3 shadow-md border border-zinc-800 z-20">
                <Settings className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Generating Quiz</h2>
            
            {apiSourceLog && (
                <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${apiSourceLog.includes('Local') ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400' : 'bg-amber-900/30 border-amber-800 text-amber-400'}`}>
                    {apiSourceLog.includes('Local') ? <Key className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {apiSourceLog}
                </div>
            )}
            
            <div className="h-16 flex items-center justify-center">
                <p className="text-zinc-400 font-medium animate-pulse transition-all duration-300">
                {currentStage}
                </p>
            </div>

            <div className="relative pt-4">
                <div className="flex justify-between text-xs font-bold text-zinc-600 mb-2 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-200 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                        style={{width: `${progress}%`}}
                    >
                    </div>
                </div>
            </div>

            <div className="mt-10 flex items-center justify-center text-xs text-zinc-500" aria-hidden="true">
                <Sparkles className="w-3 h-3 mr-2 text-blue-500" />
                <span>AI-Powered Generation</span>
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-300 text-center">
             <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30 mx-auto">
                 <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
             </div>
             
             <h2 className="text-2xl font-bold text-white mb-3">System Capacity Exhausted</h2>
             
             <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Rate Limit Error</span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Add multiple APIs to bypass rate limits and ensure uninterrupted generation.
                </p>
             </div>

             <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 mb-8 max-h-32 overflow-y-auto">
                 <code className="text-[10px] text-red-300 font-mono block whitespace-pre-wrap break-all text-left">
                     {errorLogs}
                 </code>
             </div>

             <div className="flex flex-col gap-3">
                 <button 
                    onClick={onGoToApi} 
                    className="w-full py-3.5 bg-white text-zinc-950 font-black rounded-xl hover:bg-zinc-100 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                 >
                     <Key className="w-4 h-4" /> Add API Key
                 </button>
                 
                 <button 
                    onClick={onReport} 
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                 >
                     <Mail className="w-4 h-4 text-zinc-400" /> Send Report to Admin
                 </button>

                 <button 
                    onClick={onCancel} 
                    className="w-full py-2 text-zinc-500 hover:text-white font-medium text-xs mt-2"
                 >
                     Go Back
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
