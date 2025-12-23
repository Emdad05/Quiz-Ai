
import React, { useMemo, useState } from 'react';
import { QuizResult } from '../types';
import { Check, X, Minus, Download, RotateCcw, BookOpen, Trophy, FileText, RefreshCw, ChevronRight, History } from 'lucide-react';
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
  }, [result]);

  const initiateDownloadPDF = () => setShowPdfConfirm(true);

  const executeDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let yPos = 20;

    const COLORS = {
      primary: [37, 99, 235], // Blue-600
      secondary: [71, 85, 105], // Zinc-600
      success: [16, 185, 129], // Emerald-500
      danger: [244, 63, 94], // Rose-500
      zinc: [161, 161, 170] // Zinc-400
    };

    const addPageHeader = (pageTitle: string) => {
      doc.setFillColor(249, 250, 251);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primary);
      doc.text("QUIZGENIUS AI", margin, 15);
      
      doc.setTextColor(...COLORS.zinc);
      doc.setFontSize(8);
      const now = new Date();
      doc.text(`${now.toLocaleDateString()} | ${now.toLocaleTimeString()}`, pageWidth - margin, 15, { align: 'right' });
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(pageTitle, margin, 30);
      
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, 35, pageWidth - margin, 35);
      yPos = 50;
    };

    const checkPageBreak = (neededHeight: number, title: string) => {
      if (yPos + neededHeight > 280) {
        doc.addPage();
        addPageHeader(title);
        return true;
      }
      return false;
    };

    // --- FRONT PAGE: METADATA ---
    addPageHeader("Assessment Summary");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.secondary);
    doc.text("QUIZ DETAILS", margin, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`Title: ${result.title || "Untitled Quiz"}`, margin, yPos);
    yPos += 6;
    doc.text(`Candidate: ${userName || "Anonymous User"}`, margin, yPos);
    yPos += 6;
    doc.text(`Performance: ${stats.score}% (${stats.correct}/${stats.total} Correct)`, margin, yPos);
    yPos += 15;

    doc.setDrawColor(243, 244, 246);
    doc.setFillColor(252, 253, 255);
    doc.roundedRect(margin - 5, yPos - 5, maxLineWidth + 10, 25, 3, 3, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text("ANALYTICS BREAKDOWN", margin, yPos + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Correct: ${stats.correct}   |   Incorrect: ${stats.wrong}   |   Skipped: ${stats.skipped}`, margin, yPos + 12);
    yPos += 35;

    // --- PART 1: ALL QUESTIONS ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Part 1: Questions", margin, yPos);
    yPos += 12;

    result.questions.forEach((q, i) => {
      const qText = `${i + 1}. ${q.questionText}`;
      const splitQ = doc.splitTextToSize(qText, maxLineWidth);
      const estHeight = (splitQ.length * 6) + (q.options ? q.options.length * 5 : 10) + 10;
      
      checkPageBreak(estHeight, "Part 1: Questions (Cont.)");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(splitQ, margin, yPos);
      yPos += (splitQ.length * 6) + 2;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIdx) => {
          const optLabel = `${String.fromCharCode(65 + optIdx)}) `;
          doc.text(optLabel + opt, margin + 5, yPos);
          yPos += 5;
        });
      } else {
        doc.text("[Short Answer]", margin + 5, yPos);
        yPos += 5;
      }
      yPos += 8;
    });

    // --- PART 2: ANSWERS & EXPLANATIONS ---
    doc.addPage();
    addPageHeader("Part 2: Answer Key & Insights");

    result.questions.forEach((q, i) => {
      const userAnswer = result.userAnswers[q.id];
      const isCorrect = q.options && q.options.length > 0 
        ? userAnswer === q.correctOptionIndex 
        : (userAnswer as string)?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
      const isSkipped = userAnswer === undefined || userAnswer === "";

      let correctText = "";
      if (q.options && q.options.length > 0) {
        correctText = `${String.fromCharCode(65 + (q.correctOptionIndex || 0))}) ${q.options[q.correctOptionIndex || 0]}`;
      } else {
        correctText = q.answer || "N/A";
      }

      const explanation = q.explanation.replace(/\*\*/g, '');
      const splitExpl = doc.splitTextToSize(`Explanation: ${explanation}`, maxLineWidth);
      const estHeight = splitExpl.length * 5 + 35;

      checkPageBreak(estHeight, "Part 2: Answer Key (Cont.)");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`Question ${i + 1}`, margin, yPos);
      yPos += 6;

      if (isSkipped) {
        doc.setTextColor(...COLORS.zinc);
        doc.text("STATUS: SKIPPED", margin, yPos);
      } else if (isCorrect) {
        doc.setTextColor(...COLORS.success);
        doc.text("STATUS: CORRECT", margin, yPos);
      } else {
        doc.setTextColor(...COLORS.danger);
        doc.text("STATUS: INCORRECT", margin, yPos);
      }
      yPos += 6;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.secondary);
      doc.text(`Correct Answer: ${correctText}`, margin, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(splitExpl, margin, yPos);
      yPos += (splitExpl.length * 5) + 15;
    });

    doc.save(`QuizGenius_Report_${Date.now()}.pdf`);
    setShowPdfConfirm(false);
  };

  const getScoreColor = () => {
    if (stats.score >= 80) return 'text-emerald-600';
    if (stats.score >= 50) return 'text-sky-600';
    return 'text-[#f43f5e]';
  };

  return (
    <div className="min-h-screen py-4 px-4 flex items-center justify-center bg-[#FDFDFD] font-sans selection:bg-zinc-100 overflow-x-hidden">
      <div className="max-w-2xl w-full space-y-4">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center">
              <Trophy className={`w-4 h-4 ${stats.score >= 70 ? 'text-amber-500' : 'text-zinc-300'}`} />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-zinc-900 tracking-tight leading-none">
                {result.title || "Assessment"}
              </h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Assessment Final</p>
            </div>
          </div>
          <button onClick={onRetry} className="text-zinc-300 hover:text-zinc-900 transition-colors p-2">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons at Top */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={onReview} className="px-3 py-2.5 bg-zinc-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black flex items-center justify-center gap-1.5 transition-all shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Answers
          </button>
          <button onClick={initiateDownloadPDF} className="px-3 py-2.5 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-1.5 transition-all">
            <Download className="w-3.5 h-3.5 text-emerald-500" /> Export PDF
          </button>
          <button onClick={onReattempt} className="px-3 py-2.5 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-1.5 transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> Reattempt
          </button>
          <button onClick={onRetry} className="px-3 py-2.5 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-1.5 transition-all">
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" /> New Quiz
          </button>
        </div>

        {/* Accuracy Section */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-8 flex flex-col items-center justify-center shadow-sm min-h-[180px]">
          <div className="text-center">
            <span className={`text-6xl md:text-7xl font-black tracking-tighter ${getScoreColor()}`}>
              {stats.score}%
            </span>
            <div className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mt-2">Overall Accuracy</div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Correct', value: stats.correct, icon: Check, bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
            { label: 'Wrong', value: stats.wrong, icon: X, bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100' },
            { label: 'Skipped', value: stats.skipped, icon: Minus, bg: 'bg-zinc-50', text: 'text-zinc-400', border: 'border-zinc-100' }
          ].map((s, idx) => (
            <div key={idx} className={`bg-white rounded-2xl p-4 border ${s.border} flex flex-col items-center justify-center text-center shadow-sm`}>
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center ${s.text} mb-3`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-1">{s.value}</span>
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Detailed Review Bar */}
        <div className="bg-zinc-950 rounded-2xl p-3 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 pl-2">
            <History className="w-4 h-4 text-sky-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Vault Saved</span>
          </div>
          <button onClick={onReview} className="px-4 py-2 bg-white text-zinc-950 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-100 flex items-center gap-1.5 transition-all active:scale-95">
            Detailed Review <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>
      
      {/* PDF Confirmation Modal */}
      {showPdfConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-sm w-full p-8 border border-zinc-100 text-center">
                <FileText className="w-10 h-10 text-zinc-900 mx-auto mb-4" />
                <h3 className="text-lg font-black text-zinc-900 mb-1">Export Report?</h3>
                <p className="text-zinc-500 mb-6 text-[11px] font-medium leading-relaxed">Prepare a permanent copy of your results and AI explanations for offline study.</p>
                <div className="grid grid-cols-1 gap-2">
                    <button onClick={executeDownloadPDF} className="w-full py-3 bg-zinc-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95">Download PDF</button>
                    <button onClick={() => setShowPdfConfirm(false)} className="w-full py-2 text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
