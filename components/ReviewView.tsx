import React from 'react';
import { QuizResult } from '../types';
import { Check, X, ArrowLeft, Lightbulb } from 'lucide-react';

interface ReviewViewProps {
  result: QuizResult;
  onBack: () => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({ result, onBack }) => {
  const renderFormattedExplanation = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={index} className="font-bold text-sky-900 bg-sky-50 px-1 rounded-sm border border-sky-100">{part.slice(2, -2)}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 shadow-sm h-16 flex items-center px-4">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
           <button onClick={onBack} className="flex items-center text-zinc-600 hover:text-zinc-900 font-bold transition-colors group">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3 group-hover:bg-zinc-200"><ArrowLeft className="w-4 h-4" /></div>
              <span>Back to Results</span>
            </button>
            <h1 className="text-lg font-bold text-zinc-900 hidden sm:block">Detailed Review</h1>
        </div>
      </div>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {result.questions.map((q, index) => {
            const userAnswer = result.userAnswers[q.id];
            const isShortAnswer = !q.options || q.options.length === 0;
            let isCorrect = false;
            
            if (isShortAnswer) {
                isCorrect = (userAnswer as string)?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
            } else {
                isCorrect = userAnswer === q.correctOptionIndex;
            }

            const cardBorder = isCorrect ? "border-emerald-200" : (userAnswer !== undefined ? "border-rose-200" : "border-zinc-200");
            const statusStripe = isCorrect ? "bg-emerald-500" : (userAnswer !== undefined ? "bg-rose-500" : "bg-zinc-300");

            return (
              <div key={q.id} className={`bg-white rounded-xl shadow-sm border transition-all ${cardBorder}`}>
                <div className={`h-1.5 w-full ${statusStripe}`}></div>
                <div className="p-8">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0"><span className="flex items-center justify-center w-8 h-8 rounded bg-zinc-100 text-zinc-600 font-bold text-sm">{index + 1}</span></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-zinc-900 mb-6 leading-relaxed">{q.questionText}</h3>
                      
                      <div className="space-y-3">
                        {isShortAnswer ? (
                            <div className="space-y-2">
                                <div className={`p-4 rounded-lg border text-sm font-medium ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                    <span className="block text-xs uppercase font-bold opacity-60 mb-1">Your Answer</span>
                                    {userAnswer ? (userAnswer as string) : <span className="italic text-zinc-400">No answer provided</span>}
                                </div>
                                {!isCorrect && (
                                    <div className="p-4 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900 text-sm font-medium">
                                        <span className="block text-xs uppercase font-bold opacity-60 mb-1">Correct Answer</span>
                                        {q.answer}
                                    </div>
                                )}
                            </div>
                        ) : (
                            q.options.map((opt, optIdx) => {
                                const isSelected = userAnswer === optIdx;
                                const isTargetCorrect = optIdx === q.correctOptionIndex;
                                let optionClass = "p-4 rounded-lg border text-sm font-medium flex items-center justify-between transition-colors ";
                                if (isTargetCorrect) optionClass += "bg-emerald-50 border-emerald-200 text-emerald-900";
                                else if (isSelected) optionClass += "bg-rose-50 border-rose-200 text-rose-900";
                                else optionClass += "bg-white border-zinc-100 text-zinc-500";

                                return (
                                    <div key={optIdx} className={optionClass}>
                                    <span className="flex-1">{opt}</span>
                                    {isTargetCorrect && <span className="flex items-center text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-1 rounded ml-3"><Check className="w-3 h-3 mr-1" /> Correct</span>}
                                    {isSelected && !isTargetCorrect && <span className="flex items-center text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-1 rounded ml-3"><X className="w-3 h-3 mr-1" /> Your Answer</span>}
                                    </div>
                                );
                            })
                        )}
                      </div>

                      <div className="mt-6 bg-zinc-50 rounded-lg p-6 border border-zinc-200 flex gap-4">
                        <div className="shrink-0"><div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center"><Lightbulb className="w-5 h-5 text-sky-600" /></div></div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Key Insights</p>
                          <p className="text-zinc-800 leading-7 text-sm">{renderFormattedExplanation(q.explanation)}</p>
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
    </div>
  );
};

export default ReviewView;