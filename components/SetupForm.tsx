
import React, { useState, useRef, useEffect } from 'react';
import { QuizConfig, Difficulty, QuizType, QuizResult } from '../types';
import { FileText, X, BrainCircuit, ImagePlus, ArrowRight, User, AlertCircle, History, PenTool, Loader2, PlayCircle, Layers, Save, ClipboardPaste, Sparkles, FileType } from 'lucide-react';
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
    for (let i = 0; i < 1500; i++) {
        stars.push({ x: (Math.random() - 0.5) * width * 2, y: (Math.random() - 0.5) * height * 2, z: Math.random() * width, size: Math.random() * 2 + 0.5 });
    }
    const speed = 0.4;
    const cx = width / 2;
    const cy = height / 2;
    const render = () => {
        ctx.fillStyle = '#09090b'; 
        ctx.fillRect(0, 0, width, height);
        stars.forEach(star => {
            star.z -= speed;
            if (star.z <= 0) { star.z = width; star.x = (Math.random() - 0.5) * width * 2; star.y = (Math.random() - 0.5) * height * 2; }
            const fov = width / 1.5;
            const scale = fov / star.z;
            const x = (star.x * scale) + cx;
            const y = (star.y * scale) + cy;
            const tx = (star.x * (fov / (star.z + speed * 0.5))) + cx;
            const ty = (star.y * (fov / (star.z + speed * 0.5))) + cy;
            if (x >= -100 && x <= width + 100 && y >= -100 && y <= height + 100) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, (1 - star.z / width) + 0.1)})`;
                ctx.lineWidth = Math.min(4, star.size * scale);
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(x, y);
                ctx.stroke();
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
      if (fileItems.length + files.length > 5) {
        setContentError("Maximum 5 files allowed.");
        return;
      }
      setContentError('');
      const newItems: FileItem[] = files.map((file: any) => ({
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        data: '',
        mimeType: file.type || 'application/octet-stream',
        status: 'loading',
        name: file.name
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
    setNameError('');
    setContentError('');
    let isValid = true;
    
    const validFiles = fileItems.filter(i => i.status === 'success').map(i => ({ data: i.data, mimeType: i.mimeType, name: i.name }));
    if (!content.trim() && validFiles.length === 0) { 
        setContentError("Please provide material."); 
        isValid = false; 
    }
    if (!userName.trim()) { 
        setNameError("Name required."); 
        isValid = false; 
    }

    if (isAnyFileLoading || !isValid) return;

    localStorage.setItem('quiz_username', userName.trim());
    onStart({
      userName: userName.trim(), topic: topic.trim(), content,
      questionCount, durationMinutes: duration, difficulty,
      quizType, fileUploads: validFiles
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Only allow Enter key to submit if inside a standard input and not range/select
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          // Optional: You could call handleSubmit() here if you wanted Enter to work for submission
          // but specifically for your bug, we are disabling it to prevent accidental jumps.
      }
  };

  return (
    <div 
      className="min-h-screen w-full relative overflow-x-hidden" 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
    >
      <style>{`
        @keyframes shimmer { from { background-position: 200% center; } to { background-position: -200% center; } }
        @keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .animate-shimmer { animation: shimmer 2s linear infinite; }
        .animate-breathe { animation: breathe 8s ease-in-out infinite; }
        .spotlight-overlay { background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.04), transparent 40%); z-index: 2; pointer-events: none; }
      `}</style>
      {flashVisible && (
        <div className="fixed inset-0 z-[100] bg-white pointer-events-none transition-opacity duration-[1500ms] ease-out" style={{ opacity: flashOpacity }} />
      )}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] animate-breathe"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] animate-breathe" style={{ animationDelay: '-4s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute inset-0 spotlight-overlay"></div>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 font-sans">
        {showResumeNotification && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="absolute inset-0" onClick={onDismissNotification}></div>
              <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full relative z-[110] p-6 border border-zinc-800">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-900/20">
                          <Save className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white mb-2">Session Saved</h3>
                      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                          Previous session saved. Access it via the History button.
                      </p>
                      <button onClick={onDismissNotification} className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl hover:bg-zinc-200 shadow-lg transition-colors">Okay</button>
                  </div>
              </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-8 relative z-50">
          <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-900/80 rounded-xl shadow-sm border border-zinc-800 backdrop-blur-sm shrink-0">
                  <BrainCircuit className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex flex-col">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">QuizGenius <span className="text-blue-500">AI</span></h1>
                  <p className="text-sm text-zinc-400 font-medium hidden sm:block mt-1">Study Companion</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
                type="button" onClick={onViewHistory}
                className={`flex items-center text-sm font-bold px-4 py-2.5 rounded-full transition-all border shadow-sm backdrop-blur-sm ${
                    showResumeNotification ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-zinc-950 animate-bounce bg-blue-900/50 border-blue-700 text-blue-300' : 
                    hasIncompleteQuiz ? 'bg-amber-950/50 text-amber-400 border-amber-800/50' : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
            >
                <History className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">History</span>
                {hasIncompleteQuiz && <span className="ml-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
            </button>
            <AppMenu onHome={onHome} onSetupApi={onSetupApi} onHowToUse={onHowToUse} onContact={onContact} />
          </div>
        </div>
        {hasIncompleteQuiz && (
              <div className="mb-8">
                  <button type="button" onClick={onViewHistory} className="w-full bg-gradient-to-r from-amber-950/30 to-orange-950/30 border border-amber-900/50 rounded-xl p-4 flex items-center justify-center text-amber-400 hover:from-amber-950/50 transition-all shadow-sm backdrop-blur-sm">
                      <PlayCircle className="w-5 h-5 mr-3 text-amber-500" />
                      <span className="font-semibold">Resume incomplete quiz</span>
                  </button>
              </div>
        )}
        <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-800/60 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10">
            <div className="space-y-6" ref={contentSectionRef}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 font-bold border border-zinc-700 text-sm">1</div>
                <h3 className="text-lg font-bold text-white">Source Material</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <textarea
                  id="contentInput" value={content}
                  onChange={(e) => { setContent(e.target.value); if (contentError) setContentError(''); }}
                  placeholder="Paste article text or notes here..."
                  className={`w-full h-72 p-6 text-zinc-300 bg-zinc-950/50 border rounded-xl focus:ring-2 focus:ring-blue-600 resize-none transition-all ${contentError ? 'border-red-900/50 ring-1 ring-red-900/50' : 'border-zinc-800'}`}
                />
                <div className="flex flex-col h-72">
                  <div 
                      role="button" tabIndex={0}
                      className={`flex-1 border-2 border-dashed rounded-xl bg-zinc-950/50 hover:bg-zinc-800/60 hover:border-zinc-600 transition-all flex flex-col items-center justify-center p-6 cursor-pointer group ${contentError ? 'border-red-900/50' : 'border-zinc-800'}`} 
                      onClick={() => fileInputRef.current?.click()}
                  >
                      <ImagePlus className="w-8 h-8 text-blue-500 mb-4" />
                      <h4 className="font-semibold text-white mb-1">Upload Files</h4>
                      <p className="text-sm text-zinc-500 mb-4 text-center">PDFs or Images</p>
                      <span className="px-5 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Select Documents</span>
                     <input type="file" ref={fileInputRef} accept=".pdf,image/png,image/jpeg,image/webp" multiple onChange={handleFileUpload} className="hidden" />
                  </div>
                  {fileItems.length > 0 && (
                    <div className="mt-4 flex gap-3 overflow-x-auto py-2">
                      {fileItems.map((f) => (
                        <div key={f.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 group bg-zinc-800 flex items-center justify-center shrink-0">
                          {f.status === 'loading' ? <Loader2 className="animate-spin text-blue-500" /> : f.mimeType.includes('image') ? <img src={f.data} className="w-full h-full object-cover" /> : <FileType className="w-6 h-6 text-red-400" />}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-5 h-5 text-white" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {contentError && <div className="text-red-400 bg-red-900/10 p-3 rounded-lg border border-red-900/20 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{contentError}</div>}
            </div>
            <div className="h-px bg-zinc-800"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 font-bold border border-zinc-700 text-sm">2</div>
                <h3 className="text-lg font-bold text-white">Configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
                      <label className="text-sm font-semibold text-zinc-400 mb-3 block">Candidate Name</label>
                      <input
                          ref={nameInputRef} type="text" value={userName}
                          onChange={(e) => { setUserName(e.target.value); if (nameError) setNameError(''); }}
                          placeholder="Enter your name"
                          className={`w-full p-3 bg-zinc-900/50 border rounded-lg focus:ring-2 focus:ring-blue-600 transition-all text-white ${nameError ? 'border-red-900/50' : 'border-zinc-800'}`}
                      />
                  </div>
                  <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
                      <label className="text-sm font-semibold text-zinc-400 mb-3 block">Quiz Title</label>
                      <input
                          type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                          placeholder="Auto-generated if empty"
                          className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-600 transition-all text-white"
                      />
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                    <label className="text-xs font-bold uppercase text-zinc-500 mb-3 block">Type</label>
                    <select value={quizType} onChange={(e) => setQuizType(e.target.value as QuizType)} className="w-full p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none">
                       {Object.values(QuizType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold uppercase text-zinc-500">Count</label><span className="text-sm font-bold text-white">{questionCount}</span></div>
                    <input type="range" min="3" max="50" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full accent-blue-500" />
                 </div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold uppercase text-zinc-500">Time</label><span className="text-sm font-bold text-white">{duration}m</span></div>
                    <input type="range" min="1" max="180" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full accent-blue-500" />
                 </div>
                 <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                    <label className="text-xs font-bold uppercase text-zinc-500 mb-3 block">Difficulty</label>
                    <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                       {Object.values(Difficulty).map(d => (
                           <button key={d} type="button" onClick={() => setDifficulty(d)} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${difficulty === d ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>{d}</button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
            <button type="submit" disabled={isAnyFileLoading} className="relative w-full py-4 bg-white text-zinc-950 text-lg font-bold rounded-xl shadow-lg hover:bg-zinc-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-3 group">
                <span className="relative z-10 flex items-center gap-2">
                  {isAnyFileLoading ? "Processing..." : "Generate Quiz"}
                  {!isAnyFileLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
