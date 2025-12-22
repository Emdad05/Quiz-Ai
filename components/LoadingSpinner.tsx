import React, { useState, useEffect } from 'react';
import { Settings, BrainCircuit, Sparkles, Key, Shield } from 'lucide-react';

interface LoadingSpinnerProps {
    apiSourceLog?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ apiSourceLog }) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Initializing AI Engine...");

  // Simulate realistic AI generation stages
  useEffect(() => {
    // Stage 1: Analyze (0-30%) - Fast
    // Stage 2: Generate Questions (30-70%) - Slower
    // Stage 3: Format & Validate (70-95%) - Fast
    // Stage 4: Finalize (95-100%)
    
    const startTime = Date.now();
    const duration = 8000; // Simulated duration of 8 seconds

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
  }, []);

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
      
      <div className="bg-zinc-900/50 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-zinc-800 max-w-lg w-full text-center relative overflow-hidden">
        
        {/* Decorative Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-900 to-transparent opacity-50"></div>
        
        <div className="relative inline-block mb-10" aria-hidden="true">
          {/* Animated Sparkles */}
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
    </div>
  );
};

export default LoadingSpinner;