
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { Clock, CheckCircle2, Flag, Menu, AlertTriangle, RotateCcw, Save, Trash2, LogOut, ArrowRight, ArrowLeft, X, Trophy } from 'lucide-react';

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
  
  const finishButtonRef = useRef<HTMLButtonElement>(null);
  const navAreaRef = useRef<HTMLDivElement>(null);
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
        const headerOffset = 100;
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
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optionIndex }));
    // Auto-scroll to show next/prev/finish buttons after choosing an answer
    setTimeout(() => {
        navAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 300);
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
    if (answeredCount === 0) return; // Should be handled by button disabled state anyway
    
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

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasNoAnswers = answeredCount === 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-zinc-200 text-zinc-900">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 -ml-2 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors md:hidden"
             >
                <Menu className="w-5 h-5" />
             </button>
             <div className="font-black text-xl tracking-tighter text-zinc-900 select-none hidden xs:block">QUIZ<span className="text-zinc-400 font-light">GENIUS</span></div>
          </div>

          {/* Centralized Text-Based Navigation */}
          <div className="hidden sm:flex items-center bg-zinc-100 rounded-2xl p-1 gap-1 border border-zinc-200">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center px-4 py-2 text-[11px] font-black uppercase tracking-wider text-zinc-500 hover:bg-white hover:text-zinc-900 rounded-xl disabled:opacity-10 transition-all border border-transparent hover:border-zinc-200 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Previous
            </button>
            
            <div className="px-5 py-2 bg-white rounded-lg border border-zinc-200/50 min-w-[100px] text-center shadow-sm">
               <span className="text-[12px] font-black text-zinc-900 tracking-tighter">{currentIndex + 1} OF {questions.length}</span>
            </div>

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={isLastQuestion}
              className={`flex items-center px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border border-transparent disabled:opacity-10 disabled:cursor-not-allowed ${isLastQuestion ? 'text-zinc-300' : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:border-zinc-200'}`}
            >
              Next <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </button>
          </div>

          {/* Action Area: Submit Button & Timer */}
          <div className="flex items-center gap-3">
             {/* Submit Button at Top - Disabled until at least one answer exists */}
             <button 
                onClick={checkCompletion}
                disabled={hasNoAnswers}
                title={hasNoAnswers ? "Answer at least one question to finish" : "Finish Assessment"}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 overflow-hidden ${hasNoAnswers ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none' : 'bg-zinc-900 text-white hover:bg-black'}`}
             >
                {!hasNoAnswers && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                <span className="relative z-10 flex items-center gap-2">
                    FINISH <CheckCircle2 className={`w-3.5 h-3.5 ${hasNoAnswers ? 'text-zinc-300' : 'text-blue-400'}`} />
                </span>
             </button>

             <div className="h-8 w-px bg-zinc-200 mx-1 hidden sm:block" />

             <div className={`flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-xl border border-zinc-200 ${timeLeft < 60 ? 'animate-pulse bg-red-50 border-red-100' : ''}`}>
                <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500' : 'text-zinc-400'}`} />
                <span className={`font-mono text-sm font-bold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-zinc-600'}`}>{formatTime(timeLeft)}</span>
             </div>
             
             <button onClick={requestCancel} className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 hidden sm:flex">
                <LogOut className="w-5 h-5" />
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-10">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in" 
                onClick={() => setIsSidebarOpen(false)} 
            />
        )}
        
        {/* Navigation Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-zinc-200 md:bg-transparent md:border-r-0 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'} md:translate-x-0 md:static md:block shrink-0`}>
          <div className="h-full overflow-y-auto p-6 md:p-0">
              <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 md:sticky md:top-28 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Navigator</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:bg-zinc-100 rounded-xl md:hidden">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentIndex;
                    const isReview = markedForReview.has(q.id);
                    let stateStyles = "bg-zinc-50 text-zinc-300 border-zinc-100";
                    if (isCurrent) stateStyles = "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-110 z-10";
                    else if (isReview) stateStyles = "bg-amber-50 text-amber-600 border-amber-200";
                    else if (isAnswered) stateStyles = "bg-white text-zinc-900 border-zinc-900";

                    return (
                      <button 
                        key={q.id} 
                        onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); }} 
                        className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold border transition-all duration-200 ${stateStyles} hover:border-zinc-400`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-12 pt-8 border-t border-zinc-100 space-y-4">
                    <button onClick={toggleReviewMark} className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isMarked ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}>
                        <Flag className={`w-4 h-4 ${isMarked ? 'fill-amber-600' : ''}`} /> {isMarked ? 'Marked for Review' : 'Flag Question'}
                    </button>
                    <button onClick={handleUndoAnswer} className={`w-full py-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 border border-zinc-100 hover:border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentAnswer === undefined ? 'opacity-0 pointer-events-none' : ''}`}>
                        <RotateCcw className="w-3.5 h-3.5" /> Clear Answer
                    </button>
                </div>
              </div>
          </div>
        </aside>

        {/* Assessment Card */}
        <div className="flex-1 max-w-3xl">
          <div ref={questionCardRef} className="bg-white rounded-[2.5rem] border border-zinc-200 p-8 md:p-14 min-h-[600px] flex flex-col shadow-sm transition-all animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-10">
              <span className="inline-flex items-center h-7 px-4 rounded-full bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] border border-zinc-200/50">
                Question {currentIndex + 1}
              </span>
              <div className="flex gap-2">
                {isMarked && <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 animate-in fade-in zoom-in-50"><Flag className="w-3 h-3 fill-amber-600" /> REVIEWING</span>}
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-12 leading-[1.35] tracking-tight">{currentQuestion.questionText}</h2>

            <div className="space-y-4 flex-1">
              {isShortAnswer ? (
                  <div className="animate-in fade-in duration-500">
                      <textarea
                        value={(currentAnswer as string) || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full h-48 p-8 bg-zinc-50/50 border border-zinc-200 rounded-3xl focus:ring-0 focus:border-zinc-900 outline-none text-lg transition-all placeholder:text-zinc-300 font-medium"
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = currentAnswer === idx;
                    const labels = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`group relative w-full text-left p-6 rounded-3xl border-2 flex items-start transition-all duration-300 ${isSelected ? 'border-zinc-900 bg-zinc-900 text-white shadow-2xl scale-[1.02]' : 'border-zinc-100 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl border flex-shrink-0 mr-6 flex items-center justify-center font-black text-sm transition-all ${isSelected ? 'bg-white text-zinc-900 border-white' : 'bg-zinc-100 text-zinc-400 border-zinc-200 group-hover:bg-zinc-200'}`}>
                          {labels[idx]}
                        </div>
                        <span className={`text-base font-bold leading-relaxed pr-10 mt-1 transition-colors ${isSelected ? 'text-white' : 'text-zinc-700'}`}>{option}</span>
                        {isSelected && <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white"><CheckCircle2 className="w-6 h-6 animate-in zoom-in-95" /></div>}
                      </button>
                    )
                  })}
                  </div>
              )}
            </div>

            {/* Bottom Navigation Area */}
            <div ref={navAreaRef} className="mt-14 pt-10 border-t border-zinc-100 flex flex-col items-center">
                 <div className="flex w-full items-center justify-between gap-4">
                    <button 
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-zinc-200 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> PREVIOUS
                    </button>
                    <button 
                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={isLastQuestion}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-20 ${isLastQuestion ? 'bg-zinc-100 text-zinc-300' : 'bg-zinc-900 text-white hover:bg-black shadow-lg'}`}
                    >
                        NEXT <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                 </div>
                 
                 {isLastQuestion && (
                    <div className="mt-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">
                           <Trophy className="w-3 h-3" /> FINAL QUESTION REACHED
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium mb-2">Ready to see your results?</p>
                        <button 
                          onClick={checkCompletion}
                          disabled={hasNoAnswers}
                          title={hasNoAnswers ? "Answer at least one question to submit" : "Submit Assessment"}
                          className={`px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${hasNoAnswers ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none' : 'bg-zinc-900 text-white shadow-xl hover:scale-105 active:scale-95'}`}
                        >
                           Submit Assessment <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                 )}
            </div>
          </div>
        </div>
      </main>

      {/* Incomplete Questions Alert - Updated with explicit counts and prompt phrasing */}
      {showIncompleteAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl max-md w-full p-12 border border-zinc-200 animate-in zoom-in-95 duration-300 text-center">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-8 border border-amber-100 ring-8 ring-amber-50/50">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">Wait! Empty Fields</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium text-lg">
                    You have <span className="text-zinc-900 font-bold">{questions.length - answeredCount} unattempted questions</span>. 
                    Do you want to proceed without attempting or wanna go back and attempt them?
                </p>
                <div className="flex flex-col w-full gap-4">
                    <button onClick={() => setShowIncompleteAlert(false)} className="w-full py-5 bg-zinc-900 text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl text-lg uppercase tracking-widest">
                        GO BACK & ATTEMPT
                    </button>
                    <button onClick={() => { setShowIncompleteAlert(false); setShowSubmitConfirm(true); }} className="w-full py-4 text-zinc-400 font-bold hover:text-amber-600 transition-colors uppercase tracking-widest text-xs">
                        PROCEED WITHOUT ATTEMPTING
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl max-md w-full p-12 border border-zinc-200 animate-in zoom-in-95 duration-300 text-center">
                <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-900 mx-auto mb-8 border border-zinc-200">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Submit Exam?</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium">
                    Your results will be saved automatically in your history. Are you ready to finalize your work?
                </p>
                <div className="flex flex-col w-full gap-4">
                    <button onClick={handleSubmit} className="w-full py-5 bg-zinc-900 text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl text-lg uppercase tracking-widest">CONFIRM SUBMIT</button>
                    <button onClick={() => setShowSubmitConfirm(false)} className="w-full py-4 text-zinc-400 font-bold hover:text-zinc-900 transition-colors uppercase tracking-widest text-xs">RETURN TO EXAM</button>
                </div>
            </div>
        </div>
      )}

      {/* Cancel/Exit Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl max-sm w-full p-12 border border-zinc-200 animate-in zoom-in-95 duration-300 text-center">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-8 border border-zinc-100">
                    <LogOut className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">Leave Assessment?</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium text-sm">
                    You can save your current session to continue later.
                </p>
                <div className="flex flex-col w-full gap-3">
                    <button 
                        onClick={handleSaveAndExit}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-xs"
                    >
                        <Save className="w-4 h-4" /> Save & Exit
                    </button>
                    <button 
                        onClick={handleDiscardAndExit}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white text-red-600 border border-red-100 font-black rounded-2xl hover:bg-red-50 transition-all uppercase tracking-widest text-xs"
                    >
                        <Trash2 className="w-4 h-4" /> Discard
                    </button>
                    <button 
                        onClick={() => setShowCancelConfirm(false)}
                        className="w-full py-4 text-zinc-400 font-bold hover:text-zinc-900 transition-colors uppercase tracking-widest text-[10px]"
                    >
                        Stay
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;
