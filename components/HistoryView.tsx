
import React, { useState } from 'react';
import { QuizResult } from '../types';
import { ArrowLeft, Clock, Award, Trash2, Calendar, Play, AlertTriangle, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface HistoryViewProps {
  onBack: () => void;
  onSelectResult: (result: QuizResult) => void;
  onClearHistory: () => void;
  onDeleteResult: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onSelectResult, onClearHistory, onDeleteResult }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exportConfirmResult, setExportConfirmResult] = useState<QuizResult | null>(null);

  const history: QuizResult[] = (() => {
      try {
          return JSON.parse(localStorage.getItem('quiz_history') || '[]');
      } catch {
          return [];
      }
  })();
  
  const sortedHistory = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const getStats = (result: QuizResult) => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    result.questions.forEach(q => {
      const userAnswer = result.userAnswers[q.id];
      if (userAnswer === undefined || userAnswer === "") {
        skipped++;
      } else {
        if (q.options && q.options.length > 0) {
          if (userAnswer === q.correctOptionIndex) correct++;
          else wrong++;
        } else {
          const userTxt = (userAnswer as string).trim().toLowerCase();
          const correctTxt = q.answer?.trim().toLowerCase();
          if (userTxt && correctTxt && userTxt === correctTxt) correct++;
          else wrong++;
        }
      }
    });
    const total = result.questions.length;
    const score = Math.round((correct / total) * 100);
    return { correct, wrong, skipped, score, total };
  };

  const calculateScore = (result: QuizResult) => getStats(result).score;

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

  const executeExportPdf = (result: QuizResult) => {
    const stats = getStats(result);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let yPos = 20;

    const addPageHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "bold");
        doc.text("QUIZGENIUS AI - ARCHIVE REPORT", margin, 12);
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, 14, pageWidth - margin, 14);
        doc.setTextColor(0, 0, 0);
    };

    const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > 280) {
            doc.addPage();
            addPageHeader();
            yPos = 25;
            return true;
        }
        return false;
    };

    // PAGE 1: HEADER & INFO
    addPageHeader();
    yPos = 30;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Assessment Report", margin, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("SUMMARY INFORMATION", margin, yPos);
    yPos += 8;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Title: ${result.title || "Untitled Assessment"}`, margin, yPos);
    yPos += 6;
    doc.text(`Candidate: ${localStorage.getItem('quiz_username') || "User"}`, margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Final Score: ${stats.score}% (${stats.correct}/${stats.total} Correct)`, margin, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 6;
    doc.text(`Generated At: ${new Date(result.timestamp).toLocaleString()}`, margin, yPos);
    yPos += 15;

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // PART 1: QUESTIONS ONLY
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PART 1: QUESTIONS", margin, yPos);
    yPos += 10;
    doc.setFontSize(11);

    result.questions.forEach((q, i) => {
        const qText = `${i + 1}. ${q.questionText}`;
        const splitQ = doc.splitTextToSize(qText, maxLineWidth);
        const optSpace = q.options ? q.options.length * 7 : 12;
        
        checkPageBreak(splitQ.length * 6 + optSpace + 10);
        
        doc.setFont("helvetica", "bold");
        doc.text(splitQ, margin, yPos);
        yPos += splitQ.length * 6 + 3;

        doc.setFont("helvetica", "normal");
        if (q.options && q.options.length > 0) {
            q.options.forEach((opt, optIdx) => {
                const optLabel = `${String.fromCharCode(65 + optIdx)}) `;
                const splitOpt = doc.splitTextToSize(optLabel + opt, maxLineWidth - 10);
                doc.text(splitOpt, margin + 5, yPos);
                yPos += splitOpt.length * 5 + 2;
            });
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text("   [Short Answer Response Field]", margin, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 8;
        }
        yPos += 5;
    });

    // PART 2: ANSWERS & EXPLANATIONS (Mandatory new page)
    doc.addPage();
    addPageHeader();
    yPos = 30;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PART 2: ANSWER KEY & EXPLANATIONS", margin, yPos);
    yPos += 12;

    result.questions.forEach((q, i) => {
        const userAnswer = result.userAnswers[q.id];
        let correctStr = "";
        let isCorrect = false;

        if (q.options && q.options.length > 0) {
            correctStr = `${String.fromCharCode(65 + q.correctOptionIndex!)}: ${q.options[q.correctOptionIndex!]}`;
            isCorrect = userAnswer === q.correctOptionIndex;
        } else {
            correctStr = q.answer || "N/A";
            isCorrect = (userAnswer as string)?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
        }

        const explClean = q.explanation.replace(/\*\*/g, '');
        const splitExpl = doc.splitTextToSize(`Explanation: ${explClean}`, maxLineWidth);
        
        checkPageBreak(splitExpl.length * 5 + 30);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Question ${i + 1}`, margin, yPos);
        yPos += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        if (userAnswer === undefined || userAnswer === "") {
            doc.setTextColor(150, 150, 150);
            doc.text("STATUS: SKIPPED", margin, yPos);
        } else {
            if (isCorrect) {
                doc.setTextColor(0, 128, 0);
                doc.text("STATUS: CORRECT", margin, yPos);
            } else {
                doc.setTextColor(200, 0, 0);
                doc.text("STATUS: INCORRECT", margin, yPos);
            }
        }
        doc.setTextColor(0, 0, 0);
        yPos += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`CORRECT ANSWER: ${correctStr}`, margin, yPos);
        yPos += 6;

        doc.setFont("helvetica", "italic");
        doc.setTextColor(60, 60, 60);
        doc.text(splitExpl, margin, yPos);
        yPos += splitExpl.length * 5 + 12;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
    });

    doc.save(`QuizGenius_Archive_${result.title.replace(/\s+/g, '_')}_${result.id.substring(0, 8)}.pdf`);
    setExportConfirmResult(null);
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
            <p className="text-zinc-500 mb-8">Resume incomplete assessments or review and export past performance reports.</p>

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
                                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                                    <div className="text-right flex items-center gap-3">
                                        {isInProgress ? (
                                            <button onClick={() => onSelectResult(item)} className="flex items-center text-amber-400 font-bold bg-amber-950/50 border border-amber-900/50 px-4 py-2 rounded-lg hover:bg-amber-900/50 transition-colors">
                                                <Play className="w-4 h-4 mr-2 fill-current" /> Resume
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="text-right pr-4 border-r border-zinc-800">
                                                    <span className={`block text-xl font-bold ${score >= 70 ? 'text-emerald-400' : 'text-zinc-200'}`}>{score}%</span>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Score</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setExportConfirmResult(item); }}
                                                    className="flex items-center gap-2 p-2.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-all border border-blue-900/30 font-bold text-xs"
                                                    title="Export PDF"
                                                >
                                                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                                        className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
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
        {(showClearConfirm || deleteConfirmId || exportConfirmResult) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-zinc-900 rounded-xl shadow-2xl max-sm w-full p-6 border border-zinc-800">
                    {showClearConfirm && (
                        <>
                            <div className="flex items-center gap-3 text-red-500 mb-4">
                                <Trash2 className="w-6 h-6" />
                                <h3 className="text-lg font-bold text-white">Clear History?</h3>
                            </div>
                            <p className="text-zinc-400 mb-6">Are you sure? This action cannot be undone and will permanently remove all your records.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2 text-zinc-300 font-bold hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors">Cancel</button>
                                <button onClick={handleClearAll} className="flex-1 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg transition-colors">Delete All</button>
                            </div>
                        </>
                    )}
                    {deleteConfirmId && (
                        <>
                            <div className="flex items-center gap-3 text-red-500 mb-4">
                                <Trash2 className="w-6 h-6" />
                                <h3 className="text-lg font-bold text-white">Delete Quiz?</h3>
                            </div>
                            <p className="text-zinc-400 mb-6">Are you sure you want to delete this specific record? This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 text-zinc-300 font-bold hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors">Cancel</button>
                                <button onClick={handleDeleteItem} className="flex-1 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg transition-colors">Delete</button>
                            </div>
                        </>
                    )}
                    {exportConfirmResult && (
                        <>
                            <div className="flex items-center gap-3 text-blue-500 mb-4">
                                <FileText className="w-6 h-6" />
                                <h3 className="text-lg font-bold text-white">Export PDF?</h3>
                            </div>
                            <p className="text-zinc-400 mb-6 text-sm">Do you want to generate a detailed PDF report for "{exportConfirmResult.title}"?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setExportConfirmResult(null)} className="flex-1 py-2.5 text-zinc-300 font-bold hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors">Cancel</button>
                                <button onClick={() => executeExportPdf(exportConfirmResult)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Export Now</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default HistoryView;
