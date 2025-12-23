
import React from 'react';
import { QuizResult } from '../types';
import { Check, X, ArrowLeft, Lightbulb, CheckCircle2, XCircle, Info } from 'lucide-react';

interface ReviewViewProps {
  result: QuizResult;
  onBack: () => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({ result, onBack }) => {
  const renderFormattedExplanation = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="font-bold text-blue-900 bg-blue-50 px-1 py-0.5 rounded border border-blue-100/50">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-zinc-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200 h-14 flex items-center px-4 shadow-sm">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
           <button 
              onClick={onBack} 
              className="flex items-center text-zinc-500 hover:text-zinc-900 font-black text-[10px] uppercase tracking-widest group"
           >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <h1 className="text-sm font-black text-zinc-900 tracking-tight uppercase">Performance Review</h1>
        </div>
      </header>

      <div className="pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {result.questions.map((q, index) => {
            const userAnswer = result.userAnswers[q.id];
            const isShortAnswer = !q.options || q.options.length === 0;
            let isCorrect = false;
            
            if (isShortAnswer) {
                isCorrect = (userAnswer as string)?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
            } else {
                isCorrect = userAnswer === q.correctOptionIndex;
            }

            const isSkipped = userAnswer === undefined || userAnswer === "";
            const cardBorder = isCorrect ? "border-emerald-100" : (isSkipped ? "border-zinc-200" : "border-rose-100");

            return (
              <div 
                key={q.id} 
                className={`bg-white rounded-2xl shadow-sm border ${cardBorder} overflow-hidden transition-all`}
              >
                <div className="p-5 md:p-8">
                  <div className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700' : (isSkipped ? 'bg-zinc-100 text-zinc-400' : 'bg-rose-100 text-rose-700')}`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Correct
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                            <Info className="w-2.5 h-2.5" /> Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-widest">
                            <XCircle className="w-2.5 h-2.5" /> Incorrect
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg md:text-xl font-extrabold text-zinc-900 mb-6 leading-tight tracking-tight">
                        {q.questionText}
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-2 mb-6">
                        {isShortAnswer ? (
                            <div className="space-y-2">
                                <div className={`p-4 rounded-xl border text-sm font-semibold ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                                    <span className="block text-[8px] uppercase font-black tracking-widest text-zinc-400 mb-1">Your Submission</span>
                                    {userAnswer ? (
                                      <span className="text-zinc-800">{userAnswer as string}</span>
                                    ) : (
                                      <span className="italic text-zinc-300 font-medium">No answer provided</span>
                                    )}
                                </div>
                                {!isCorrect && (
                                    <div className="p-4 rounded-xl border bg-emerald-50/30 border-emerald-100 text-zinc-900 text-sm font-semibold">
                                        <span className="block text-[8px] uppercase font-black tracking-widest text-emerald-600/60 mb-1">Correct Response</span>
                                        {q.answer}
                                    </div>
                                )}
                            </div>
                        ) : (
                            q.options.map((opt, optIdx) => {
                                const isSelected = userAnswer === optIdx;
                                const isTargetCorrect = optIdx === q.correctOptionIndex;
                                const labels = ['A', 'B', 'C', 'D', 'E'];
                                
                                let optionClass = "p-3 rounded-xl border flex items-start gap-3 transition-all ";
                                if (isTargetCorrect) {
                                  optionClass += "bg-emerald-50/50 border-emerald-200 text-emerald-900";
                                } else if (isSelected) {
                                  optionClass += "bg-rose-50/50 border-rose-200 text-rose-900";
                                } else {
                                  optionClass += "bg-white border-zinc-50 text-zinc-400 opacity-60";
                                }

                                return (
                                    <div key={optIdx} className={optionClass}>
                                      <div className={`w-6 h-6 rounded-lg border flex-shrink-0 flex items-center justify-center font-black text-[10px] transition-all ${isTargetCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : isSelected ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                                        {labels[optIdx]}
                                      </div>
                                      <span className={`flex-1 text-sm font-bold mt-0.5 ${isTargetCorrect || isSelected ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                        {opt}
                                      </span>
                                    </div>
                                );
                            })
                        )}
                      </div>

                      <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 flex gap-4">
                        <div className="shrink-0">
                          <Lightbulb className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Expert Insight</p>
                          <div className="text-zinc-700 leading-relaxed text-sm font-medium">
                            {renderFormattedExplanation(q.explanation)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="py-12 flex flex-col items-center">
        <button 
          onClick={onBack} 
          className="px-8 py-3 bg-zinc-900 text-white font-black rounded-xl hover:bg-black transition-all active:scale-95 text-[10px] uppercase tracking-widest"
        >
          Return to Summary
        </button>
      </footer>
    </div>
  );
};

export default ReviewView;
