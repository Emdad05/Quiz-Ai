import React, { useState, useEffect } from 'react';
import SetupForm from './components/SetupForm';
import QuizInterface from './components/QuizInterface';
import ResultsView from './components/ResultsView';
import ReviewView from './components/ReviewView';
import HistoryView from './components/HistoryView';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './components/LandingPage';
import ApiManagement from './components/ApiManagement';
import HowToUse from './components/HowToUse';
import { generateQuizFromContent } from './services/geminiService';
import { AppState, QuizConfig, Question, QuizResult, QuizType, Difficulty } from './types';
import { AlertTriangle, XCircle, Mail, ShieldAlert, X, Send } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeNotification, setResumeNotification] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [apiSourceLog, setApiSourceLog] = useState<string>("");
  const [criticalErrorLogs, setCriticalErrorLogs] = useState<string | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error("Unhandled Promise Rejection:", event.reason);
        setError("An unexpected error occurred. Please try again.");
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Handle body overflow for all modals
  useEffect(() => {
    if (showContactModal || criticalErrorLogs) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showContactModal, criticalErrorLogs]);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('quiz_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.appState === 'GENERATING') {
            setAppState('SETUP');
            return;
        }
        const resetStates = ['QUIZ', 'RESULTS', 'REVIEW'];
        if (resetStates.includes(parsed.appState)) {
           setAppState('SETUP');
           setResumeNotification(true);
        } else if (parsed.appState && parsed.appState !== 'LANDING') {
          if (parsed.questions) setQuestions(parsed.questions);
          if (parsed.config) setConfig(parsed.config);
          if (parsed.result) setResult(parsed.result);
          setAppState(parsed.appState);
        }
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      localStorage.removeItem('quiz_session');
    }
  }, []);

  useEffect(() => {
    if (['LANDING', 'SETUP', 'HISTORY', 'API_MANAGEMENT', 'HOW_TO_USE', 'GENERATING'].includes(appState)) {
      localStorage.removeItem('quiz_session');
      return;
    }
    const sessionData = { appState, questions, config, result };
    try {
      localStorage.setItem('quiz_session', JSON.stringify(sessionData));
    } catch (e) {
       console.warn("Storage quota exceeded, session not saved.");
    }
  }, [appState, questions, config, result]);

  const updateHistory = (newResult: QuizResult) => {
      try {
        const history: QuizResult[] = JSON.parse(localStorage.getItem('quiz_history') || '[]');
        const index = history.findIndex(h => h.id === newResult.id);
        if (index >= 0) history[index] = newResult;
        else history.push(newResult);
        localStorage.setItem('quiz_history', JSON.stringify(history));
      } catch (e) { console.error(e); }
  };

  const startQuiz = async (newConfig: QuizConfig) => {
    setConfig(newConfig);
    try {
      const localKeys = localStorage.getItem('user_gemini_keys');
      const hasLocalKeys = localKeys && JSON.parse(localKeys).length > 0;
      setApiSourceLog(hasLocalKeys ? "Using Local Storage APIs" : "Using Internal System APIs");
    } catch(e) {
      setApiSourceLog("Using Internal System APIs");
    }
    setAppState('GENERATING');
    setError(null);
    setCriticalErrorLogs(null);
    try {
      const data = await generateQuizFromContent(newConfig);
      if (!data || !data.questions || data.questions.length === 0) throw new Error("The AI failed to generate valid questions. Please try different content.");
      const finalTitle = data.title || newConfig.topic || "Generated Assessment";
      setConfig(prev => prev ? ({ ...prev, topic: finalTitle }) : newConfig);
      setQuestions(data.questions);
      const quizId = crypto.randomUUID();
      const initialResult: QuizResult = {
          id: quizId,
          title: finalTitle,
          timestamp: Date.now(),
          status: 'IN_PROGRESS',
          questions: data.questions,
          userAnswers: {},
          timeTakenSeconds: 0,
          currentIndex: 0
      };
      setResult(initialResult);
      updateHistory(initialResult);
      setAppState('QUIZ');
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("CRITICAL_FAILURE_LOGS::")) {
          const logs = msg.split("CRITICAL_FAILURE_LOGS::")[1];
          setCriticalErrorLogs(logs);
      } else {
          setError(msg || "Failed to generate quiz. Please check your connection and try again.");
      }
      setAppState('SETUP');
    }
  };

  const handleQuizComplete = (userAnswers: Record<number, number | string>, timeTaken: number) => {
    if (!config || !result) return;
    const completedResult: QuizResult = {
      ...result,
      status: 'COMPLETED',
      userAnswers,
      timeTakenSeconds: timeTaken,
      currentIndex: 0 
    };
    setResult(completedResult);
    setAppState('RESULTS');
    updateHistory(completedResult);
    localStorage.removeItem('quiz_progress');
  };

  const resetApp = () => {
    setAppState('SETUP');
    setConfig(null);
    setQuestions([]);
    setResult(null);
    setError(null);
    localStorage.removeItem('quiz_session');
    localStorage.removeItem('quiz_progress');
  };
  
  const handleBackToLanding = () => {
      resetApp();
      setAppState('LANDING');
  }

  const handleQuizExit = (shouldSave: boolean) => {
      if (!shouldSave && result) {
          try {
              const history: QuizResult[] = JSON.parse(localStorage.getItem('quiz_history') || '[]');
              const newHistory = history.filter(h => h.id !== result.id);
              localStorage.setItem('quiz_history', JSON.stringify(newHistory));
          } catch (e) { console.error("Error removing quiz from history:", e); }
      }
      resetApp();
  };

  const clearHistory = () => {
     localStorage.removeItem('quiz_history');
     setAppState('SETUP');
  }

  const handleDeleteHistoryItem = (id: string) => {
      try {
          const history: QuizResult[] = JSON.parse(localStorage.getItem('quiz_history') || '[]');
          const newHistory = history.filter(h => h.id !== id);
          localStorage.setItem('quiz_history', JSON.stringify(newHistory));
          setAppState('HISTORY');
      } catch (e) { console.error(e); }
  };

  const handleResumeQuiz = (selectedResult: QuizResult) => {
      if (selectedResult.status === 'IN_PROGRESS') {
          setResult(selectedResult);
          setQuestions(selectedResult.questions);
          setConfig({
              userName: "Resuming Candidate",
              topic: selectedResult.title,
              questionCount: selectedResult.questions.length,
              durationMinutes: 15, 
              difficulty: Difficulty.MEDIUM,
              quizType: QuizType.MULTIPLE_CHOICE,
              content: "",
              fileUploads: []
          });
          const progressData = {
              quizId: selectedResult.questions.map(q => q.id).join(','),
              currentIndex: selectedResult.currentIndex || 0,
              answers: selectedResult.userAnswers || {},
              timeLeft: 900 - (selectedResult.timeTakenSeconds || 0), 
              markedForReview: selectedResult.markedForReview || []
          };
          localStorage.setItem('quiz_progress', JSON.stringify(progressData));
          setAppState('QUIZ');
      } else {
          setResult(selectedResult);
          setQuestions(selectedResult.questions);
          setConfig({
              userName: "History Review",
              topic: selectedResult.title,
              questionCount: selectedResult.questions.length,
              durationMinutes: 0,
              difficulty: Difficulty.MEDIUM,
              quizType: QuizType.MULTIPLE_CHOICE,
              content: "",
              fileUploads: []
          });
          setAppState('RESULTS');
      }
  };

  const handleReattempt = () => {
      if (!questions || questions.length === 0) return;
      const newQuizId = crypto.randomUUID();
      const title = result?.title || config?.topic || "Assessment";
      const initialResult: QuizResult = {
          id: newQuizId,
          title: title,
          timestamp: Date.now(),
          status: 'IN_PROGRESS',
          questions: questions,
          userAnswers: {},
          timeTakenSeconds: 0,
          currentIndex: 0
      };
      setResult(initialResult);
      updateHistory(initialResult);
      localStorage.removeItem('quiz_progress');
      setAppState('QUIZ');
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:emdadhussain840@gmail.com?subject=QuizGenius AI Support Request';
  };

  const handleReportIssue = () => {
      if (!criticalErrorLogs) return;
      const subject = encodeURIComponent("QuizGenius AI - Critical System Failure Report");
      const body = encodeURIComponent(`System Resource Exhausted Report:\n\nLogs:\n${criticalErrorLogs}`);
      window.open(`mailto:emdadhussain840@gmail.com?subject=${subject}&body=${body}`);
  };

  if (appState === 'GENERATING') return <LoadingSpinner apiSourceLog={apiSourceLog} />;

  const historyKey = localStorage.getItem('quiz_history')?.length || 'default';
  const isDarkMode = ['LANDING', 'SETUP', 'GENERATING', 'API_MANAGEMENT', 'HOW_TO_USE'].includes(appState);

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* Standard Notification Error */}
      {error && !criticalErrorLogs && (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
           <div className={`border-b p-4 shadow-lg ${isDarkMode ? 'bg-red-900/90 border-red-800 text-white' : 'bg-red-50 border-red-200 text-red-900'}`}>
               <div className="max-w-5xl mx-auto flex items-start gap-3">
                   <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${isDarkMode ? 'text-red-200' : 'text-red-600'}`} />
                   <div className="flex-1">
                       <h3 className={`text-sm font-bold ${isDarkMode ? 'text-red-100' : 'text-red-800'}`}>Application Error</h3>
                       <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
                   </div>
                   <button 
                       onClick={() => setError(null)}
                       className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-red-800 text-red-300' : 'hover:bg-red-100 text-red-500'}`}
                   >
                       <XCircle className="w-5 h-5" />
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* Critical Admin Report Dialog */}
      {criticalErrorLogs && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
             <div className="bg-zinc-900 border border-red-900/50 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
                 <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                         <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">System Capacity Exhausted</h2>
                     <p className="text-zinc-400 text-sm leading-relaxed">
                         All available AI models and API keys are currently rate-limited or unavailable.
                     </p>
                 </div>
                 <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 mb-6 max-h-32 overflow-y-auto">
                     <code className="text-xs text-red-300 font-mono block whitespace-pre-wrap break-all">
                         {criticalErrorLogs.substring(0, 500)}...
                     </code>
                 </div>
                 <div className="flex flex-col gap-3">
                     <button onClick={handleReportIssue} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                         <Mail className="w-5 h-5" /> Report to Admin
                     </button>
                     <button onClick={() => setCriticalErrorLogs(null)} className="w-full py-3 text-zinc-500 hover:text-white font-medium">Dismiss</button>
                 </div>
             </div>
         </div>
      )}

      {/* Global Contact Modal - Guaranteed to be centered regardless of parent transforms */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-300 mx-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-900/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Mail className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight text-center">Support Center</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-10 text-center max-w-[280px]">
                Have a question or feedback? Our technical team is ready to assist you.
              </p>
              <button 
                onClick={handleEmailSupport}
                className="w-full py-4 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.15)] group"
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Contact Email
              </button>
            </div>
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-center">
              <button 
                onClick={() => setShowContactModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest py-1 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === 'LANDING' && (
        <LandingPage 
            onStart={() => setAppState('SETUP')} 
            onSetupApi={() => setAppState('API_MANAGEMENT')}
            onHowToUse={() => setAppState('HOW_TO_USE')}
            onContact={() => setShowContactModal(true)}
        />
      )}

      {appState === 'API_MANAGEMENT' && (
        <ApiManagement 
            onContinue={() => setAppState('SETUP')} 
            onBack={() => setAppState('LANDING')}
            onNeedHelp={() => setAppState('HOW_TO_USE')}
        />
      )}

      {appState === 'HOW_TO_USE' && (
        <HowToUse 
            onBack={() => setAppState('LANDING')} 
            onGoToApi={() => setAppState('API_MANAGEMENT')}
            onStartGenerating={() => setAppState('SETUP')}
        />
      )}

      {appState === 'SETUP' && (
        <SetupForm 
            onStart={startQuiz} 
            onViewHistory={() => setAppState('HISTORY')} 
            onHome={handleBackToLanding}
            onSetupApi={() => setAppState('API_MANAGEMENT')}
            onHowToUse={() => setAppState('HOW_TO_USE')}
            onContact={() => setShowContactModal(true)}
            showResumeNotification={resumeNotification}
            onDismissNotification={() => setResumeNotification(false)}
        />
      )}

      {appState === 'HISTORY' && (
        <HistoryView 
            key={historyKey}
            onBack={() => setAppState('SETUP')}
            onSelectResult={handleResumeQuiz}
            onClearHistory={clearHistory}
            onDeleteResult={handleDeleteHistoryItem}
        />
      )}

      {appState === 'QUIZ' && config && (
        <QuizInterface 
          questions={questions} 
          durationMinutes={config.durationMinutes}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      )}

      {appState === 'RESULTS' && result && (
        <ResultsView 
          result={result} 
          userName={config?.userName}
          onRetry={resetApp} 
          onReview={() => setAppState('REVIEW')}
          onReattempt={handleReattempt}
        />
      )}

      {appState === 'REVIEW' && result && (
        <ReviewView result={result} onBack={() => setAppState('RESULTS')} />
      )}
    </div>
  );
};

export default App;