
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { Clock, CheckCircle2, Flag, Menu, AlertTriangle, RotateCcw, Save, Trash2, LogOut, ArrowRight, ArrowLeft, X, Trophy, SkipForward } from 'lucide-react';

interface QuizInterfaceProps {
  questions: Question[];
  durationMinutes: number;
  onComplete: (userAnswers: Record<number, number | string>, timeTaken: number) => void;
  onExit: (shouldSave: boolean) => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ questions, durationMinutes, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showIncompleteAlert, setShowIncompleteAlert] = useState(false);
  
  const questionCardRef = useRef<HTMLDivElement>(null);

  // Auto-save and progress restoration
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('quiz_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        const currentIds = questions.map(q => q.id).join(',');
        if (parsed.quizId === currentIds) {
          setCurrentIndex(parsed.currentIndex || 0);
          setAnswers(parsed.answers || {});
          if (typeof parsed.timeLeft === 'number') setTimeLeft(parsed.timeLeft);
          if (parsed.markedForReview) setMarkedForReview(new Set(parsed.markedForReview));
        }
      }
    } catch (e) {
      console.error("Failed to restore progress:", e);
    }
  }, [questions]);

  useEffect(() => {
    const progressData = {
      quizId: questions.map(q => q.id).join(','),
      currentIndex,
      answers,
      timeLeft,
      markedForReview: Array.from(markedForReview)
    };
    localStorage.setItem('quiz_progress', JSON.stringify(progressData));

    try {
        const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
        const activeIndex = history.findIndex((h: any) => h.status === 'IN_PROGRESS' && h.questions[0].questionText === questions[0].questionText);
        
        if (activeIndex !== -1) {
            history[activeIndex] = {
                ...history[activeIndex],
                userAnswers: answers,
                timeTakenSeconds: (durationMinutes * 60) - timeLeft,
                currentIndex: currentIndex,
                markedForReview: Array.from(markedForReview)
            };
            localStorage.setItem('quiz_history', JSON.stringify(history));
        }
    } catch (e) { /* silent fail */ }
  }, [currentIndex, answers, timeLeft, markedForReview, questions, durationMinutes]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to Top of question when navigating (Next/Prev/Sidebar)
  useEffect(() => {
    if (questionCardRef.current) {
        const headerOffset = 80;
        const elementPosition = questionCardRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
  }, [currentIndex]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => {
        const currentQId = questions[currentIndex].id;
        // Toggle logic: If already selected, unselect it.
        if (prev[currentQId] === optionIndex) {
            const next = { ...prev };
            delete next[currentQId];
            return next;
        }
        return { ...prev, [currentQId]: optionIndex };
    });
  };
  
  const handleTextAnswer = (text: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: text }));
  }

  const handleUndoAnswer = () => {
      setAnswers(prev => {
          const next = { ...prev };
          delete next[questions[currentIndex].id];
          return next;
      });
  };

  const toggleReviewMark = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(questions[currentIndex].id)) next.delete(questions[currentIndex].id);
      else next.add(questions[currentIndex].id);
      return next;
    });
  };

  const checkCompletion = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0) return;
    
    if (answeredCount < questions.length) {
      setShowIncompleteAlert(true);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handleSubmit = () => {
    const timeTaken = (durationMinutes * 60) - timeLeft;
    onComplete(answers, timeTaken);
  };

  const requestCancel = () => {
      setIsSidebarOpen(false);
      setShowCancelConfirm(true);
  }

  const handleSaveAndExit = () => onExit(true);
  const handleDiscardAndExit = () => onExit(false);

  const currentQuestion = questions[currentIndex];
  const isMarked = markedForReview.has(currentQuestion.id);
  const currentAnswer = answers[currentQuestion.id];
  const isShortAnswer = !currentQuestion.options || currentQuestion.options.length === 0;
  const hasCurrentAnswer = currentAnswer !== undefined && currentAnswer !== "";

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasNoAnswers = answeredCount === 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-zinc-200 text-zinc-900">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 transition-all duration-300 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-1.5 -ml-1 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors md:hidden"
             >
                <Menu className="w-5 h-5" />
             </button>
             <div className="font-black text-lg tracking-tighter text-zinc-900 select-none hidden xs:block">QUIZ<span className="text-zinc-400 font-light">GENIUS</span></div>
          </div>

          {/* Centralized Navigation (Desktop) */}
          <div className="hidden sm:flex items-center bg-zinc-100 rounded-xl p-0.5 gap-0.5 border border-zinc-200">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:bg-white hover:text-zinc-900 rounded-lg disabled:opacity-10 transition-all border border-transparent hover:border-zinc-200 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3 h-3 mr-1.5" /> Prev
            </button>
            
            <div className="px-3 py-1.5 bg-white rounded-lg border border-zinc-200/50 min-w-[80px] text-center shadow-sm">
               <span className="text-[10px] font-black text-zinc-900 tracking-tighter">{currentIndex + 1} / {questions.length}</span>
            </div>

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={isLastQuestion}
              className={`flex items-center px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border border-transparent disabled:opacity-10 disabled:cursor-not-allowed ${isLastQuestion ? 'text-zinc-300' : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:border-zinc-200'}`}
            >
              Next <ArrowRight className="w-3 h-3 ml-1.5" />
            </button>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-2">
             <button 
                onClick={checkCompletion}
                disabled={hasNoAnswers}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md active:scale-95 overflow-hidden hidden sm:flex ${hasNoAnswers ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none' : 'bg-zinc-900 text-white hover:bg-black'}`}
             >
                <span className="relative z-10 flex items-center gap-2">
                    FINISH <CheckCircle2 className={`w-3 h-3 ${hasNoAnswers ? 'text-zinc-300' : 'text-blue-400'}`} />
                </span>
             </button>

             <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200 ${timeLeft < 60 ? 'animate-pulse bg-red-50 border-red-100' : ''}`}>
                <Clock className={`w-3.5 h-3.5 ${timeLeft < 60 ? 'text-red-500' : 'text-zinc-400'}`} />
                <span className={`font-mono text-xs font-bold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-zinc-600'}`}>{formatTime(timeLeft)}</span>
             </div>
             
             <button onClick={requestCancel} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100">
                <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-100">
            <div 
                className="h-full bg-zinc-900 transition-all duration-500 ease-out" 
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
        </div>
      </header>

      {/* Main Content - Added padding bottom for fixed footer */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6 pb-28">
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in" 
                onClick={() => setIsSidebarOpen(false)} 
            />
        )}
        
        {/* Navigation Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-60 bg-white border-r border-zinc-200 md:bg-transparent md:border-r-0 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'} md:translate-x-0 md:static md:block shrink-0`}>
          <div className="h-full overflow-y-auto p-4 md:p-0">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:sticky md:top-24 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Navigator</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 -mr-1 text-zinc-400 hover:bg-zinc-100 rounded-lg md:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentIndex;
                    const isReview = markedForReview.has(q.id);
                    let stateStyles = "bg-zinc-50 text-zinc-300 border-zinc-100";
                    if (isCurrent) stateStyles = "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105 z-10";
                    else if (isReview) stateStyles = "bg-amber-50 text-amber-600 border-amber-200";
                    else if (isAnswered) stateStyles = "bg-white text-zinc-900 border-zinc-900";

                    return (
                      <button 
                        key={q.id} 
                        onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); }} 
                        className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-200 ${stateStyles} hover:border-zinc-400`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-8 pt-6 border-t border-zinc-100 space-y-3">
                    <button onClick={toggleReviewMark} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${isMarked ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}>
                        <Flag className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600' : ''}`} /> {isMarked ? 'Reviewing' : 'Flag'}
                    </button>
                    <button onClick={handleUndoAnswer} className={`w-full py-2.5 bg-zinc-50 text-zinc-400 hover:text-zinc-900 border border-zinc-100 hover:border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentAnswer === undefined ? 'opacity-0 pointer-events-none' : ''}`}>
                        <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                </div>
              </div>
          </div>
        </aside>

        {/* Assessment Card */}
        <div className="flex-1 max-w-2xl mx-auto md:mx-0">
          <div ref={questionCardRef} className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-10 min-h-[400px] flex flex-col shadow-sm transition-all animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center h-6 px-3 rounded-full bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em] border border-zinc-200/50">
                Question {currentIndex + 1}
              </span>
              {isMarked && <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-amber-600"><Flag className="w-2.5 h-2.5 fill-amber-600" /> REVIEW</span>}
            </div>

            {/* Adjusted Text Size for Mobile */}
            <h2 className="text-lg md:text-2xl font-extrabold text-zinc-900 mb-8 leading-snug tracking-tight">{currentQuestion.questionText}</h2>

            <div className="space-y-3 flex-1">
              {isShortAnswer ? (
                  <div className="animate-in fade-in duration-300">
                      <textarea
                        value={(currentAnswer as string) || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full h-40 p-6 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-0 focus:border-zinc-900 outline-none text-sm md:text-base transition-all placeholder:text-zinc-300 font-medium"
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = currentAnswer === idx;
                    const labels = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`group relative w-full text-left p-3.5 rounded-2xl border-2 flex items-start transition-all duration-300 ${isSelected ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl scale-[1.01]' : 'border-zinc-100 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >
                        <div className={`w-7 h-7 rounded-lg border flex-shrink-0 mr-3 flex items-center justify-center font-black text-[10px] transition-all ${isSelected ? 'bg-white text-zinc-900 border-white' : 'bg-zinc-100 text-zinc-400 border-zinc-200 group-hover:bg-zinc-200'}`}>
                          {labels[idx]}
                        </div>
                        {/* Adjusted Option Text Size */}
                        <span className={`text-sm font-medium leading-relaxed pr-8 mt-0.5 transition-colors ${isSelected ? 'text-white' : 'text-zinc-700'}`}>{option}</span>
                        {isSelected && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white"><CheckCircle2 className="w-4 h-4 animate-in zoom-in-95" /></div>}
                      </button>
                    )
                  })}
                  </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-zinc-200 p-3 z-50 flex items-center justify-between gap-3 safe-area-bottom shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
           <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-zinc-200 active:scale-95 flex items-center justify-center gap-1.5"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev
            </button>
            
            {isLastQuestion ? (
                <button 
                  onClick={checkCompletion}
                  disabled={hasNoAnswers}
                  className={`flex-[2] py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ${hasNoAnswers ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'}`}
                >
                   Submit Quiz <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={isLastQuestion}
                    className={`flex-[2] py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg ${hasCurrentAnswer ? 'bg-zinc-900 text-white hover:bg-black shadow-zinc-900/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 shadow-zinc-200'}`}
                >
                    {hasCurrentAnswer ? (
                        <>Next <ArrowRight className="w-3.5 h-3.5" /></>
                    ) : (
                        <>Skip <SkipForward className="w-3.5 h-3.5" /></>
                    )}
                </button>
            )}
      </div>

      {/* Incomplete Quiz Alert Modal */}
      {showIncompleteAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 border border-zinc-200 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-8 border border-amber-100 shadow-sm">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">Wait! Unfinished Tasks</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium text-base">
                    You still have <span className="text-zinc-900 font-bold underline decoration-amber-400 decoration-2 underline-offset-4">{questions.length - answeredCount} unanswered questions</span>. Are you sure you want to proceed?
                </p>
                <div className="flex flex-col w-full gap-4">
                    <button 
                        onClick={() => setShowIncompleteAlert(false)} 
                        className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl hover:shadow-zinc-900/20 text-sm uppercase tracking-[0.15em] active:scale-95"
                    >
                        GO BACK & ATTEMPT
                    </button>
                    <button 
                        onClick={() => { setShowIncompleteAlert(false); setShowSubmitConfirm(true); }} 
                        className="w-full py-4 bg-zinc-100 text-zinc-600 border border-zinc-200 font-black rounded-2xl hover:bg-zinc-200 hover:text-zinc-900 transition-all text-sm uppercase tracking-[0.15em] active:scale-95"
                    >
                        PROCEED REGARDLESS
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Standard Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 md:p-10 border border-zinc-200 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-900 mx-auto mb-8 border border-zinc-200">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">Final Submission</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium text-sm">
                    Ready to lock in your answers? You can review them in your history later.
                </p>
                <div className="flex flex-col w-full gap-4">
                    <button onClick={handleSubmit} className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl text-sm uppercase tracking-widest active:scale-95">CONFIRM SUBMIT</button>
                    <button onClick={() => setShowSubmitConfirm(false)} className="w-full py-3 bg-white text-zinc-400 font-bold hover:text-zinc-900 transition-colors uppercase tracking-widest text-[10px]">CANCEL</button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 md:p-12 border border-zinc-200 animate-in zoom-in-95 text-center">
                <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-8 border border-zinc-100">
                    <LogOut className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Leave Quiz?</h3>
                <p className="text-zinc-500 mb-12 leading-relaxed font-medium text-base">
                    Your current progress will be lost unless you save. How would you like to exit?
                </p>
                <div className="flex flex-col w-full gap-4">
                    <button 
                        onClick={handleSaveAndExit}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl shadow-zinc-900/20 uppercase tracking-[0.1em] text-sm active:scale-95"
                    >
                        <Save className="w-5 h-5" /> SAVE & EXIT
                    </button>
                    <button 
                        onClick={handleDiscardAndExit}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white text-red-600 border-2 border-red-100 font-black rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all uppercase tracking-[0.1em] text-sm active:scale-95"
                    >
                        <Trash2 className="w-5 h-5" /> DISCARD PROGRESS
                    </button>
                    <button 
                        onClick={() => setShowCancelConfirm(false)} 
                        className="w-full py-4 bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 font-black rounded-2xl transition-all uppercase tracking-[0.1em] text-sm mt-2 active:scale-95"
                    >
                        STAY IN EXAM
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;
