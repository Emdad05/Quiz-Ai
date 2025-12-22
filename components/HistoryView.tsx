import React, { useState } from 'react';
import { QuizResult } from '../types';
import { ArrowLeft, Clock, Award, Trash2, Calendar, Play, AlertTriangle } from 'lucide-react';

interface HistoryViewProps {
  onBack: () => void;
  onSelectResult: (result: QuizResult) => void;
  onClearHistory: () => void;
  onDeleteResult: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onSelectResult, onClearHistory, onDeleteResult }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const history: QuizResult[] = (() => {
      try {
          return JSON.parse(localStorage.getItem('quiz_history') || '[]');
      } catch {
          return [];
      }
  })();
  
  const sortedHistory = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const calculateScore = (result: QuizResult) => {
      let correct = 0;
      if (!result.userAnswers) return 0;
      result.questions.forEach(q => {
          if (q.options && q.options.length > 0) {
              if (result.userAnswers[q.id] === q.correctOptionIndex) correct++;
          } else {
             const userTxt = (result.userAnswers[q.id] as string)?.trim().toLowerCase();
             const correctTxt = q.answer?.trim().toLowerCase();
             if (userTxt && correctTxt && userTxt === correctTxt) correct++;
          }
      });
      return Math.round((correct / result.questions.length) * 100);
  };

  const handleClearAll = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };

  const handleDeleteItem = () => {
    if (deleteConfirmId) {
      onDeleteResult(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans p-6 md:p-12 text-white">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center text-zinc-400 hover:text-white font-bold transition-colors">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>
                {history.length > 0 && (
                    <button onClick={() => setShowClearConfirm(true)} className="flex items-center text-red-400 hover:text-red-300 text-sm font-bold bg-zinc-900 px-4 py-2 rounded-lg border border-red-900/50 hover:border-red-800 shadow-sm transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear All
                    </button>
                )}
            </div>

            <h1 className="text-3xl font-extrabold text-white mb-2">Quiz History</h1>
            <p className="text-zinc-500 mb-8">Resume incomplete assessments or review past performance.</p>

            {sortedHistory.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-300 mb-2">No history yet</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedHistory.map((item, idx) => {
                        const score = calculateScore(item);
                        const date = new Date(item.timestamp).toLocaleDateString();
                        const isInProgress = item.status === 'IN_PROGRESS';

                        return (
                            <div key={idx} className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800 flex flex-col md:flex-row gap-6 md:items-center justify-between group hover:border-zinc-700 transition-colors">
                                <div className="flex-1 cursor-pointer" onClick={() => onSelectResult(item)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isInProgress && <span className="bg-amber-900/50 text-amber-300 border border-amber-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">In Progress</span>}
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{item.title || "Untitled Assessment"}</h3>
                                    </div>
                                    <div className="flex items-center text-sm text-zinc-500 gap-4 mt-2">
                                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {date}</span>
                                        <span className="flex items-center"><Award className="w-4 h-4 mr-1.5" /> {item.questions.length} Questions</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                                    <div className="text-right">
                                        {isInProgress ? (
                                            <button onClick={() => onSelectResult(item)} className="flex items-center text-amber-400 font-bold bg-amber-950/50 border border-amber-900/50 px-4 py-2 rounded-lg hover:bg-amber-900/50 transition-colors">
                                                <Play className="w-4 h-4 mr-2 fill-current" /> Resume
                                            </button>
                                        ) : (
                                            <div>
                                                <span className={`block text-2xl font-bold ${score >= 70 ? 'text-emerald-400' : 'text-zinc-200'}`}>{score}%</span>
                                                <span className="text-xs font-bold text-zinc-500 uppercase">Score</span>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                                        className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
                                        title="Delete Quiz"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Modals - Dark Mode */}
        {(showClearConfirm || deleteConfirmId) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-zinc-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-zinc-800">
                    <div className="flex items-center gap-3 text-red-500 mb-4">
                        <Trash2 className="w-6 h-6" />
                        <h3 className="text-lg font-bold text-white">{showClearConfirm ? 'Clear History?' : 'Delete Quiz?'}</h3>
                    </div>
                    <p className="text-zinc-400 mb-6">Are you sure? This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => { setShowClearConfirm(false); setDeleteConfirmId(null); }} className="flex-1 py-2 text-zinc-300 font-bold hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors">Cancel</button>
                        <button onClick={showClearConfirm ? handleClearAll : handleDeleteItem} className="flex-1 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default HistoryView;