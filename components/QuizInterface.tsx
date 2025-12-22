import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Flag, Menu, SkipForward, AlertTriangle, RotateCcw, X, Save, Trash2, LogOut } from 'lucide-react';

interface QuizInterfaceProps {
  questions: Question[];
  durationMinutes: number;
  onComplete: (userAnswers: Record<number, number | string>, timeTaken: number) => void;
  onExit: (shouldSave: boolean) => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ questions, durationMinutes, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Store answers as number (index) or string (text)
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optionIndex }));
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

  const requestSubmit = () => setShowSubmitConfirm(true);
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
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white sticky top-0 z-20 border-b border-zinc-200 relative shadow-sm">
        <div className="absolute bottom-0 left-0 w-full flex h-1.5" role="tablist">
           {questions.map((q, idx) => {
               const isCurrent = idx === currentIndex;
               const isAnswered = answers[q.id] !== undefined;
               const isFlagged = markedForReview.has(q.id);
               let bgColor = 'bg-zinc-200 hover:bg-zinc-300';
               if (isCurrent) bgColor = 'bg-blue-600';
               else if (isFlagged) bgColor = 'bg-yellow-400';
               else if (isAnswered) bgColor = 'bg-blue-400';

               return (
                   <button
                       key={q.id}
                       onClick={() => setCurrentIndex(idx)}
                       className={`flex-1 transition-colors duration-200 ${bgColor} ${idx < questions.length - 1 ? 'border-r border-white/50' : ''}`}
                   />
               );
           })}
        </div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-md">
                <Menu className="w-6 h-6" />
             </button>
             <div className="font-bold text-xl text-zinc-900 hidden xs:block">QuizGenius</div>
             <div className="flex items-center space-x-2 text-zinc-700 font-medium">
                <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-600' : 'text-zinc-900'}`} />
                <span className={`font-mono text-lg ${timeLeft < 60 ? 'text-red-600' : ''}`}>{formatTime(timeLeft)}</span>
             </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden sm:block text-xs font-semibold text-zinc-500 mr-2">{Math.round(progressPercent)}% Complete</div>
             <button onClick={requestCancel} className="hidden sm:flex text-zinc-500 hover:text-red-600 font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
                 Cancel
             </button>
             <button onClick={requestSubmit} className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">Submit</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8 relative">
        {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-50 md:bg-transparent transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 md:static md:block shrink-0`}>
          <div className="h-full overflow-y-auto p-4 md:p-0">
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 md:sticky md:top-24">
                <div className="flex items-center justify-between mb-6 hidden md:flex">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Navigator</h3>
                  <button onClick={requestCancel} className="text-xs text-red-600 hover:underline font-semibold">Quit</button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentIndex;
                    const isReview = markedForReview.has(q.id);
                    let btnClass = "aspect-square rounded flex items-center justify-center text-sm font-bold border ";
                    if (isCurrent) btnClass += "bg-blue-600 text-white border-blue-600";
                    else if (isReview) btnClass += "bg-white text-blue-600 border-blue-300";
                    else if (isAnswered) btnClass += "bg-white text-zinc-900 border-zinc-800";
                    else btnClass += "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 border-zinc-200";
                    return (
                      <button key={q.id} onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); }} className={btnClass}>{idx + 1}</button>
                    );
                  })}
                </div>
                
                {/* Mobile Menu Footer Action */}
                <div className="mt-8 pt-4 border-t border-zinc-100 md:hidden">
                    <button onClick={requestCancel} className="w-full flex items-center justify-center gap-2 text-red-600 font-bold p-2 hover:bg-red-50 rounded-lg">
                        <LogOut className="w-4 h-4" /> Cancel Quiz
                    </button>
                </div>
              </div>
          </div>
        </aside>

        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 md:p-10 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <span className="inline-flex items-center h-8 px-3 rounded bg-zinc-100 text-zinc-700 text-sm font-bold">
                Q {currentIndex + 1} <span className="text-zinc-400 font-normal ml-1">/ {questions.length}</span>
              </span>
              <div className="flex items-center gap-3">
                  {currentAnswer !== undefined && (
                      <button onClick={handleUndoAnswer} className="flex items-center space-x-2 px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-md text-sm font-medium">
                          <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Undo</span>
                      </button>
                  )}
                  <button onClick={toggleReviewMark} className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold border ${isMarked ? 'bg-zinc-100 text-zinc-900 border-zinc-300' : 'text-zinc-400 border-transparent'}`}>
                    <Flag className={`w-4 h-4 ${isMarked ? 'fill-zinc-900' : ''}`} /> <span className="hidden sm:inline">Review</span>
                  </button>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-8 leading-snug">{currentQuestion.questionText}</h2>

            <div className="space-y-4 flex-1">
              {isShortAnswer ? (
                  <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-2">Your Answer</label>
                      <textarea
                        value={(currentAnswer as string) || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full h-32 p-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg"
                      />
                  </div>
              ) : (
                  currentQuestion.options.map((option, idx) => {
                    const isSelected = currentAnswer === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-5 rounded-lg border flex items-start group transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center mt-0.5 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-zinc-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className={`text-base ${isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-700'}`}>{option}</span>
                      </button>
                    )
                  })
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-10 pt-6 border-t border-zinc-100 gap-4">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-zinc-500 font-bold hover:text-zinc-900 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Previous
              </button>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {currentIndex < questions.length - 1 ? (
                    <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800"
                    >
                    Next <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                ) : (
                    <button onClick={requestSubmit} className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800">
                    Finish Exam <CheckCircle2 className="w-5 h-5 ml-2" />
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 text-amber-500 mb-4">
                    <AlertTriangle className="w-8 h-8" />
                    <h3 className="text-xl font-bold text-zinc-900">Submit Assessment?</h3>
                </div>
                <p className="text-zinc-600 mb-6">You are about to submit your assessment. Unanswered questions will be marked incorrect.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 text-zinc-700 font-bold hover:bg-zinc-100 rounded-lg border border-zinc-200">Review</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-zinc-900 text-white font-bold hover:bg-zinc-800 rounded-lg">Submit</button>
                </div>
            </div>
        </div>
      )}

      {/* Cancel/Exit Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-zinc-200">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <LogOut className="w-6 h-6" />
                    <h3 className="text-lg font-bold text-zinc-900">Cancel Assessment?</h3>
                </div>
                <p className="text-zinc-600 mb-6 text-sm">
                    You are leaving the exam. Would you like to save your progress to resume later, or discard it?
                </p>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleSaveAndExit}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white font-bold rounded-lg hover:bg-zinc-800 shadow-sm"
                    >
                        <Save className="w-4 h-4" /> Save & Exit
                    </button>
                    <button 
                        onClick={handleDiscardAndExit}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" /> Discard & Exit
                    </button>
                    <button 
                        onClick={() => setShowCancelConfirm(false)}
                        className="w-full py-3 text-zinc-500 font-bold hover:text-zinc-800"
                    >
                        Continue Quiz
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;