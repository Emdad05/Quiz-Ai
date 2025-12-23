
import React, { useMemo, useState } from 'react';
import { QuizResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Check, X, Minus, Download, RotateCcw, BookOpen, Trophy, FileText, RefreshCw, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ResultsViewProps {
  result: QuizResult;
  userName?: string;
  onRetry: () => void;
  onReview: () => void;
  onReattempt: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, userName, onRetry, onReview, onReattempt }) => {
  const [showPdfConfirm, setShowPdfConfirm] = useState(false);

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    result.questions.forEach(q => {
      const userAnswer = result.userAnswers[q.id];
      if (userAnswer === undefined || userAnswer === "") {
        skipped++;
      } else {
          if (q.options && q.options.length > 0) {
              // MC/TF
              if (userAnswer === q.correctOptionIndex) correct++;
              else wrong++;
          } else {
              // Short Answer
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
  }, [result]);

  const chartData = [
    { name: 'Correct', value: stats.correct, color: '#10b981' }, 
    { name: 'Wrong', value: stats.wrong, color: '#f43f5e' },    
    { name: 'Skipped', value: stats.skipped, color: '#e4e4e7' }, 
  ].filter(d => d.value > 0);

  const initiateDownloadPDF = () => {
    setShowPdfConfirm(true);
  };

  const executeDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Helper: Add consistent header to pages
    const addPageHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "bold");
        doc.text("QUIZGENIUS AI", margin, 12);
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, 14, pageWidth - margin, 14);
        doc.setTextColor(0, 0, 0);
    };

    // Helper: Handle page breaks
    const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > 280) {
            doc.addPage();
            addPageHeader();
            yPos = 25;
            return true;
        }
        return false;
    };

    // --- INITIAL HEADER & METADATA ---
    addPageHeader();
    yPos = 30;

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Assessment Report", margin, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("QUIZ DETAILS", margin, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.text(`Title: ${result.title || "Untitled Assessment"}`, margin, yPos);
    yPos += 6;
    doc.text(`Candidate: ${userName || "Anonymous User"}`, margin, yPos);
    yPos += 6;
    doc.text(`Final Score: ${stats.score}% (${stats.correct}/${stats.total} correct)`, margin, yPos);
    yPos += 6;
    doc.text(`Exported At: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 15;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // --- PART 1: QUESTIONS ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PART 1: QUESTIONS", margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    result.questions.forEach((q, i) => {
        const qText = `${i + 1}. ${q.questionText}`;
        const splitQ = doc.splitTextToSize(qText, maxLineWidth);
        
        // Estimate height for Q + Options (MCQ usually 4 options)
        const estOptionsHeight = q.options ? q.options.length * 6 : 10;
        checkPageBreak(splitQ.length * 6 + estOptionsHeight + 10);

        doc.setFont("helvetica", "bold");
        doc.text(splitQ, margin, yPos);
        yPos += splitQ.length * 6 + 2;

        doc.setFont("helvetica", "normal");
        if (q.options && q.options.length > 0) {
            q.options.forEach((opt, optIdx) => {
                const optLabel = String.fromCharCode(65 + optIdx) + ") ";
                const splitOpt = doc.splitTextToSize(optLabel + opt, maxLineWidth - 10);
                doc.text(splitOpt, margin + 5, yPos);
                yPos += splitOpt.length * 5 + 1;
            });
        } else {
            doc.setTextColor(180, 180, 180);
            doc.text("[Short Answer / Free Response]", margin + 5, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 7;
        }
        yPos += 6;
    });

    // --- PART 2: ANSWER KEY ---
    doc.addPage();
    addPageHeader();
    yPos = 30;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PART 2: ANSWER KEY & EXPLANATIONS", margin, yPos);
    yPos += 12;

    doc.setFontSize(11);
    result.questions.forEach((q, i) => {
        const header = `Question ${i + 1}`;
        const userAnswer = result.userAnswers[q.id];
        
        let correctText = "";
        let isCorrect = false;

        if (!q.options || q.options.length === 0) {
            correctText = q.answer || "N/A";
            isCorrect = (userAnswer as string)?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
        } else {
            correctText = `${String.fromCharCode(65 + (q.correctOptionIndex || 0))}) ${q.options[q.correctOptionIndex || 0]}`;
            isCorrect = userAnswer === q.correctOptionIndex;
        }

        const cleanExpl = q.explanation.replace(/\*\*/g, '');
        const splitExpl = doc.splitTextToSize(`Insight: ${cleanExpl}`, maxLineWidth);
        
        checkPageBreak(splitExpl.length * 5 + 25);

        doc.setFont("helvetica", "bold");
        doc.text(header, margin, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        // Status indicator
        if (userAnswer === undefined || userAnswer === "") {
            doc.setTextColor(150, 150, 150);
            doc.text("Status: Skipped", margin, yPos);
        } else {
            if (isCorrect) {
                doc.setTextColor(0, 120, 0);
            } else {
                doc.setTextColor(200, 0, 0);
            }
            doc.text(`Status: ${isCorrect ? 'Correct' : 'Incorrect'}`, margin, yPos);
        }
        doc.setTextColor(0, 0, 0);
        yPos += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`Correct Choice: ${correctText}`, margin, yPos);
        yPos += 6;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(splitExpl, margin, yPos);
        
        yPos += splitExpl.length * 5 + 12;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
    });

    doc.save(`QuizGenius_Results_${Date.now()}.pdf`);
    setShowPdfConfirm(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-zinc-50 font-sans">
      <div className="max-w-5xl w-full space-y-8">
        
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-white shadow-sm border border-zinc-200 mb-4">
             <Trophy className={`w-12 h-12 ${stats.score > 70 ? 'text-sky-600' : 'text-zinc-300'}`} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">{result.title || "Assessment Complete"}</h1>
          <div className="mt-4 mb-8 space-y-2">
            <p className="text-emerald-600 font-bold flex items-center justify-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5" />
                your quizzes are saved here
            </p>
            <p className="text-zinc-500 font-medium flex items-center justify-center gap-2">
                <History className="w-4 h-4" />
                export them to pdf now to prevent data loss
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
             <button onClick={onReview} className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 shadow-md flex items-center justify-center transition-all active:scale-95">
                <BookOpen className="w-5 h-5 mr-2" /> Review Answers
              </button>
             <button onClick={onReattempt} className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-900 border border-zinc-300 rounded-lg font-bold hover:bg-zinc-50 shadow-sm flex items-center justify-center transition-all active:scale-95">
                <RefreshCw className="w-5 h-5 mr-2" /> Reattempt
             </button>
             <button onClick={initiateDownloadPDF} className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-900 border border-zinc-300 rounded-lg font-bold hover:bg-zinc-50 shadow-sm flex items-center justify-center transition-all active:scale-95">
                <Download className="w-5 h-5 mr-2" /> PDF Report
             </button>
             <button onClick={onRetry} className="w-full sm:w-auto px-6 py-3 text-sky-600 hover:text-sky-700 font-semibold flex items-center justify-center hover:bg-sky-50 rounded-lg transition-all">
                <RotateCcw className="w-4 h-4 mr-2" /> New Quiz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Accuracy</h2>
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Background Text (Low z-index) */}
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <span className="text-5xl font-extrabold text-zinc-900 tracking-tight">{stats.score}%</span>
              </div>
              
              {/* Chart (High z-index) - Ensures tooltip covers the text */}
              <div className="relative z-10 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} cornerRadius={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', opacity: 1 }}
                        wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col h-full">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center h-full">
                   <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3"><Check className="w-5 h-5" /></div>
                   <span className="text-3xl font-bold text-zinc-900">{stats.correct}</span>
                   <span className="text-xs font-bold uppercase text-zinc-400 mt-1">Correct</span>
                </div>
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center h-full">
                   <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-3"><X className="w-5 h-5" /></div>
                   <span className="text-3xl font-bold text-zinc-900">{stats.wrong}</span>
                   <span className="text-xs font-bold uppercase text-zinc-400 mt-1">Incorrect</span>
                </div>
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center h-full">
                   <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-3"><Minus className="w-5 h-5" /></div>
                   <span className="text-3xl font-bold text-zinc-900">{stats.skipped}</span>
                   <span className="text-xs font-bold uppercase text-zinc-400 mt-1">Skipped</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {showPdfConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-zinc-200">
                <div className="flex items-center gap-3 text-zinc-900 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Download Report?</h3>
                </div>
                <p className="text-zinc-600 mb-6 text-sm leading-relaxed">
                    This will generate a PDF containing your results, answers, and AI-powered explanations. Do you want to proceed?
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShowPdfConfirm(false)} className="flex-1 py-2.5 text-zinc-700 font-bold hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors">Cancel</button>
                    <button onClick={executeDownloadPDF} className="flex-1 py-2.5 bg-zinc-900 text-white font-bold hover:bg-zinc-800 rounded-lg shadow-sm transition-colors">Download</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
