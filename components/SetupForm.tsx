import React, { useState, useRef, useEffect } from 'react';
import { QuizConfig, Difficulty, QuizType, QuizResult } from '../types';
import { BrainCircuit, ImagePlus, ArrowRight, AlertCircle, History, Loader2, PlayCircle, X, Sparkles, FileType, FileImage, FileText, CheckCircle2, BookmarkCheck } from 'lucide-react';
import AppMenu from './AppMenu';

interface SetupFormProps {
  onStart: (config: QuizConfig) => void;
  onViewHistory: () => void;
  onHome: () => void;
  onSetupApi: () => void;
  onHowToUse: () => void;
  onContact: () => void;
  showResumeNotification?: boolean;
  onDismissNotification?: () => void;
}

interface FileItem {
  id: string;
  data: string;
  mimeType: string;
  status: 'loading' | 'success' | 'error';
  name: string;
}

const SetupForm: React.FC<SetupFormProps> = ({ 
  onStart, onViewHistory, onHome, onSetupApi, onHowToUse, onContact, 
  showResumeNotification, onDismissNotification 
}) => {
  const [content, setContent] = useState('');
  const [userName, setUserName] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [quizType, setQuizType] = useState<QuizType>(QuizType.MULTIPLE_CHOICE);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [nameError, setNameError] = useState('');
  const [contentError, setContentError] = useState('');
  const [hasIncompleteQuiz, setHasIncompleteQuiz] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flashOpacity, setFlashOpacity] = useState(1);
  const [flashVisible, setFlashVisible] = useState(true);
  const isAnyFileLoading = fileItems.some(f => f.status === 'loading');

  useEffect(() => {
    const savedName = localStorage.getItem('quiz_username');
    if (savedName) setUserName(savedName);
    try {
        const history: QuizResult[] = JSON.parse(localStorage.getItem('quiz_history') || '[]');
        setHasIncompleteQuiz(history.some(q => q.status === 'IN_PROGRESS'));
    } catch(e) {}
  }, [showResumeNotification]);

  useEffect(() => {
      const timer1 = setTimeout(() => setFlashOpacity(0), 100);
      const timer2 = setTimeout(() => setFlashVisible(false), 2000);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
      containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Robust keyboard dismissal
  useEffect(() => {
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // If the user touches/clicks an input, its label, or a button, do nothing
      if (target.closest('input, textarea, button, label, select, [role="button"]')) {
        return;
      }

      // If we touch the background, blur whatever is active to hide the keyboard
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement) {
        activeEl.blur();
      }
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
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
    for (let i = 0; i < 1500; i++) stars.push({ x: (Math.random() - 0.5) * width * 2, y: (Math.random() - 0.5) * height * 2, z: Math.random() * width, size: Math.random() * 2 + 0.5 });
    const speed = 0.4;
    const cx = width / 2;
    const cy = height / 2;
    const render = () => {
        ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, width, height);
        stars.forEach(star => {
            star.z -= speed;
            if (star.z <= 0) { star.z = width; star.x = (Math.random() - 0.5) * width * 2; star.y = (Math.random() - 0.5) * height * 2; }
            const scale = (width / 1.5) / star.z;
            const x = (star.x * scale) + cx;
            const y = (star.y * scale) + cy;
            if (x >= -100 && x <= width + 100 && y >= -100 && y <= height + 100) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, (1 - star.z / width) + 0.1)})`;
                ctx.lineWidth = Math.min(4, star.size * scale);
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y); ctx.stroke();
            }
        });
        animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (fileItems.length + files.length > 5) { setContentError("Maximum 5 files allowed."); return; }
      setContentError('');
      const newItems: FileItem[] = files.map((file: any) => ({
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        data: '', mimeType: file.type || 'application/octet-stream', status: 'loading', name: file.name
      }));
      setFileItems(prev => [...prev, ...newItems]);
      files.forEach((file, index) => {
        const item = newItems[index];
        const reader = new FileReader();
        reader.onloadend = () => setFileItems(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success', data: reader.result as string } : f));
        reader.onerror = () => setFileItems(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
        reader.readAsDataURL(file as Blob);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => setFileItems(prev => prev.filter(item => item.id !== id));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNameError(''); setContentError('');
    let isValid = true;
    const validFiles = fileItems.filter(i => i.status === 'success').map(i => ({ data: i.data, mimeType: i.mimeType, name: i.name }));
    if (!content.trim() && validFiles.length === 0) { setContentError("Please provide material."); isValid = false; }
    if (!userName.trim()) { setNameError("Name required."); isValid = false; }
    if (isAnyFileLoading || !isValid) return;
    localStorage.setItem('quiz_username', userName.trim());
    onStart({ userName: userName.trim(), topic: topic.trim(), content, questionCount, durationMinutes: duration, difficulty, quizType, fileUploads: validFiles });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="min-h-screen w-full relative overflow-x-hidden" style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}>
      <style>{`
        @keyframes shimmer { from { background-position: 200% center; } to { background-position: -200% center; } }
        @keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        @keyframes soft-pulse { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        .spotlight-overlay { background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.04), transparent 40%); z-index: 2; pointer-events: none; }
        .file-card-animate { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-highlight { animation: soft-pulse 2s infinite; }
      `}</style>
      {flashVisible && <div className="fixed inset-0 z-[100] bg-white pointer-events-none transition-opacity duration-[1500ms] ease-out" style={{ opacity: flashOpacity }} />}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 spotlight-overlay"></div>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 font-sans">
        {showResumeNotification && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-zinc-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-zinc-800 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                      <BookmarkCheck className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Quiz Saved!</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                      We found an unfinished assessment. Your progress has been safely stored in your <strong>History</strong>.
                  </p>
                  <button 
                    onClick={onDismissNotification} 
                    className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all shadow-xl active:scale-95"
                  >
                      Got it, thanks!
                  </button>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-4 font-bold">Check the History button above</p>
              </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-8 relative z-50">
          <div className="flex items-center gap-3"><div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800"><BrainCircuit className="w-8 h-8 text-blue-500" /></div><div><h1 className="text-2xl font-extrabold text-white leading-none">QuizGenius <span className="text-blue-500">AI</span></h1></div></div>
          <div className="flex items-center gap-3">
            <button 
                onClick={onViewHistory} 
                className={`flex items-center text-sm font-bold px-5 py-2.5 rounded-full transition-all border relative ${hasIncompleteQuiz ? 'bg-amber-500 text-zinc-950 border-amber-400 pulse-highlight' : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'}`}
            >
              <History className={`w-4 h-4 mr-2 ${hasIncompleteQuiz ? 'animate-spin-slow' : ''}`} /> 
              History
              {hasIncompleteQuiz && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950"></span>
              )}
            </button>
            <AppMenu onHome={onHome} onSetupApi={onSetupApi} onHowToUse={onHowToUse} onContact={onContact} />
          </div>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-800/60 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10">
            <div className="space-y-6" ref={contentSectionRef}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 font-bold text-sm">1</div><h3 className="text-lg font-bold text-white">Source Material</h3></div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-900/30 rounded-full"><Sparkles className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Free Tier Optimized</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <textarea value={content} onChange={(e) => { setContent(e.target.value); if (contentError) setContentError(''); }} placeholder="Paste content here..." className={`w-full h-[360px] p-6 text-zinc-300 bg-zinc-950/50 border rounded-xl focus:ring-2 focus:ring-blue-600 resize-none transition-all ${contentError ? 'border-red-900/50' : 'border-zinc-800'}`} />
                <div className="flex flex-col h-[360px] gap-4">
                  <div onClick={() => fileInputRef.current?.click()} className="flex-[0.6] border-2 border-dashed rounded-xl bg-zinc-950/50 hover:bg-zinc-800/60 flex flex-col items-center justify-center p-6 cursor-pointer border-zinc-800 hover:border-blue-500/50 group transition-all">
                    <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-zinc-800 group-hover:border-blue-500/30">
                        <ImagePlus className="w-6 h-6 text-blue-500" />
                    </div>
                    <h4 className="font-bold text-white mb-1">Upload Files</h4>
                    <p className="text-xs text-zinc-500 text-center max-w-[200px]">Supports Images & PDFs<br/>(Max 5 files)</p>
                    <input type="file" ref={fileInputRef} accept=".pdf,image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </div>
                  
                  <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Selected Materials</span>
                        <span className="text-[10px] font-bold text-zinc-400">{fileItems.length}/5</span>
                    </div>
                    {fileItems.length === 0 ? (
                        <div className="flex-1 border border-dashed border-zinc-800/50 rounded-lg flex items-center justify-center">
                            <p className="text-[11px] text-zinc-600 font-medium">No files selected</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {fileItems.map(f => (
                                <div key={f.id} className="file-card-animate flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 group relative">
                                    <div className="w-10 h-10 rounded-md bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0 overflow-hidden">
                                        {f.status === 'loading' ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        ) : f.mimeType.includes('image') ? (
                                            <img src={f.data} className="w-full h-full object-cover" />
                                        ) : (
                                            <FileType className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-zinc-200 truncate pr-6">{f.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {f.status === 'loading' ? (
                                                <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">Uploading...</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[9px] text-emerald-400 uppercase tracking-tighter font-bold">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeFile(f.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all text-zinc-500">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              </div>
              {contentError && <div className="text-red-400 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{contentError}</div>}
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2"><div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 font-bold text-sm">2</div><h3 className="text-lg font-bold text-white">Configuration</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800"><label className="text-sm font-semibold text-zinc-400 mb-3 block">Name</label><input ref={nameInputRef} type="text" value={userName} onChange={(e) => { setUserName(e.target.value); if (nameError) setNameError(''); }} placeholder="Enter name" className={`w-full p-3 bg-zinc-900/50 border rounded-lg focus:ring-2 focus:ring-blue-600 transition-all text-white ${nameError ? 'border-red-900/50' : 'border-zinc-800'}`} /></div>
                  <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800"><label className="text-sm font-semibold text-zinc-400 mb-3 block">Topic</label><input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Auto-title" className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-600 transition-all text-white" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800"><label className="text-xs font-bold uppercase text-zinc-500 mb-3 block">Type</label><select value={quizType} onChange={(e) => setQuizType(e.target.value as QuizType)} className="w-full p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none">{Object.values(QuizType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800"><div className="flex justify-between items-center mb-3"><label className="text-xs font-bold uppercase text-zinc-500">Count</label><span className="text-sm font-bold text-white">{questionCount}</span></div><input type="range" min="3" max="50" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full accent-blue-500" /></div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800"><div className="flex justify-between items-center mb-3"><label className="text-xs font-bold uppercase text-zinc-500">Time</label><span className="text-sm font-bold text-white">{duration}m</span></div><input type="range" min="1" max="180" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full accent-blue-500" /></div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                  <label className="text-xs font-bold uppercase text-zinc-500 mb-3 block">Difficulty</label>
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
                    {Object.values(Difficulty).map(d => {
                      const isActive = difficulty === d;
                      let activeStyle = '';
                      if (isActive) {
                        if (d === Difficulty.EASY) activeStyle = 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                        else if (d === Difficulty.MEDIUM) activeStyle = 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
                        else if (d === Difficulty.HARD) activeStyle = 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]';
                      }
                      return (
                        <button 
                          key={d} 
                          type="button" 
                          onClick={() => setDifficulty(d)} 
                          className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${isActive ? activeStyle : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                 </div>
              </div>
            </div>
            <button type="submit" disabled={isAnyFileLoading} className="relative w-full py-4 bg-white text-zinc-950 text-lg font-bold rounded-xl shadow-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 group">Generate Quiz <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;