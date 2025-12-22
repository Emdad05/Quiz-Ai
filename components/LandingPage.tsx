import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { BrainCircuit, Sparkles, Upload, Zap, ShieldCheck, ArrowRight, Key } from 'lucide-react';
import AppMenu from './AppMenu';

interface LandingPageProps {
  onStart: () => void;
  onSetupApi: () => void;
  onHowToUse: () => void;
  onContact: () => void;
}

const LandingPage: React.FC<LandingPageProps> = memo(({ onStart, onSetupApi, onHowToUse, onContact }) => {
  const [isWarping, setIsWarping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleStart = useCallback(() => {
    setIsWarping(true);
    setTimeout(() => {
      onStart();
    }, 3750); 
  }, [onStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = e.clientX;
      const y = e.clientY;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    window.addEventListener('resize', handleResize);
    handleResize();
    const stars: {x: number, y: number, z: number, size: number}[] = [];
    const starCount = 2000; 
    for (let i = 0; i < starCount; i++) { stars.push({ x: (Math.random() - 0.5) * width * 2, y: (Math.random() - 0.5) * height * 2, z: Math.random() * width, size: Math.random() * 2 + 0.5 }); }
    let speed = 0.2; 
    const cx = width / 2;
    const cy = height / 2;
    const render = () => {
        ctx.fillStyle = '#09090b'; 
        ctx.fillRect(0, 0, width, height);
        if (isWarping) { speed *= 1.06; } else { speed = 0.5; }
        ctx.lineCap = 'round';
        stars.forEach(star => {
            star.z -= speed;
            if (star.z <= 0) { star.z = width; star.x = (Math.random() - 0.5) * width * 2; star.y = (Math.random() - 0.5) * height * 2; }
            const fov = width / 1.5;
            const scale = fov / star.z;
            const x = (star.x * scale) + cx;
            const y = (star.y * scale) + cy;
            const streakFactor = Math.max(1, speed * 0.5); 
            const tailZ = star.z + streakFactor;
            const scaleTail = fov / tailZ;
            const tx = (star.x * scaleTail) + cx;
            const ty = (star.y * scaleTail) + cy;
            if (x >= -100 && x <= width + 100 && y >= -100 && y <= height + 100) {
                const alpha = Math.min(1, (1 - star.z / width) + 0.1);
                let color = `rgba(255, 255, 255, ${alpha})`;
                if (speed > 10) { const blue = 255; const green = Math.min(255, 200 + (1000/speed)); const red = Math.min(255, 200 + (1000/speed)); color = `rgba(${red}, ${green}, ${blue}, ${alpha})`; }
                ctx.strokeStyle = color;
                const currentSize = Math.min(4, star.size * scale);
                ctx.lineWidth = currentSize;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        });
        if (speed > 80) { const flashOpacity = Math.min((speed - 80) / 100, 1); ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`; ctx.fillRect(0, 0, width, height); }
        animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, [isWarping]);

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-zinc-950 text-white font-sans selection:bg-zinc-700 selection:text-white relative overflow-x-hidden`}
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
    >
      <style>{`
        @keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        @keyframes text-shimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-breathe { animation: breathe 8s ease-in-out infinite; }
        .animate-text-shimmer { background-size: 200% auto; animation: text-shimmer 5s linear infinite; }
        .spotlight-overlay { background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.04), transparent 40%); z-index: 2; pointer-events: none; }
        .content-container { transition: opacity 0.5s ease-in, transform 0.5s ease-in; }
        .ui-exit { opacity: 0; transform: scale(1.1); pointer-events: none; }
      `}</style>
      <canvas ref={canvasRef} className={`fixed inset-0 z-[0] pointer-events-none transition-opacity duration-300 opacity-100`} />
      <div className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none`}>
         <div className={`transition-opacity duration-1000 ${isWarping ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] animate-breathe"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] animate-breathe" style={{ animationDelay: '-4s' }}></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>
        <div className="absolute inset-0 spotlight-overlay"></div>
      </div>
      <div className={`relative z-10 content-container ${isWarping ? 'ui-exit' : ''}`}>
        <nav className="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-white text-black p-1.5 rounded-lg shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)]">
                <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">QuizGenius AI</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onSetupApi}
                    className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center gap-2"
                >
                    <Key className="w-3 h-3" /> Add API Keys
                </button>
                <AppMenu 
                  onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                  onHowToUse={onHowToUse} 
                  onSetupApi={onSetupApi}
                  onContact={onContact}
                />
            </div>
            </div>
        </nav>
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-400 mb-8 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-3 h-3 text-white animate-pulse" />
            <span>Powered by Gemini</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 animate-text-shimmer max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Master any subject with <br className="hidden md:block" />
            intelligent assessments
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Transform your notes, articles, and diagrams into comprehensive quizzes instantly. 
            The professional standard for automated self-assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <button 
              onClick={handleStart}
              className="group px-8 py-4 bg-white text-zinc-950 text-base font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] transform hover:-translate-y-1 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
        
        <div className="border-y border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Context Aware</h3>
                <p className="text-zinc-400 leading-relaxed relative z-10">
                  Upload images, diagrams, or paste extensive notes. Our engine parses visual and textual data to create relevant context.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Instant Generation</h3>
                <p className="text-zinc-400 leading-relaxed relative z-10">
                  Experience zero-latency learning. Generate tailored multiple-choice and true/false assessments in seconds.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Deep Insights</h3>
                <p className="text-zinc-400 leading-relaxed relative z-10">
                  Receive detailed explanations for every answer, highlighting key concepts to reinforce your understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
        <footer className="py-12 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-zinc-500" />
              <span className="font-bold tracking-tight text-zinc-300">QuizGenius AI</span>
            </div>
            <p className="text-zinc-600 text-sm font-medium">
              © {new Date().getFullYear()} QuizGenius AI.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default LandingPage;