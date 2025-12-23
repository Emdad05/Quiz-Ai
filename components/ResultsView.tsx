
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
  onHistory: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, userName, onRetry, onReview, onReattempt, onHistory }) => {
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

    const addPageHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "bold");
        doc.text("QUIZGENIUS AI - ASSESSMENT REPORT", margin, 12);
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
    doc.text(`Candidate: ${userName || localStorage.getItem('quiz_username') || "User"}`, margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Final Score: ${stats.score}% (${stats.correct}/${stats.total} Correct)`, margin, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 6;
    doc.text(`Completion Date: ${new Date(result.timestamp).toLocaleString()}`, margin, yPos);
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

    doc.save(`QuizResults_${result.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    setShowPdfConfirm(false);
  };

  const getScoreStatus = () => {
    if (stats.score >= 90) return { text: 'OUTSTANDING', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (stats.score >= 70) return { text: 'GREAT WORK', color: 'text-sky-500', bg: 'bg-sky-500/10' };
    if (stats.score >= 50) return { text: 'PASSABLE', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { text: 'NEED REVIEW', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const scoreStatus = getScoreStatus();

  return (
    <div className="min-h-screen py-6 px-4 flex items-center justify-center bg-[#FDFDFD] font-sans selection:bg-zinc-100 overflow-x-hidden">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center">
              <Trophy className={`w-5 h-5 ${stats.score >= 70 ? 'text-amber-500' : 'text-zinc-300'}`} />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-zinc-900 tracking-tight leading-none">
                {result.title || "Assessment"}
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Completion Summary</p>
            </div>
          </div>
          <button onClick={onRetry} className="text-zinc-300 hover:text-zinc-900 transition-colors p-2">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Score Card */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-10 md:p-14 flex flex-col items-center justify-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] text-center">
            <span className={`inline-block px-4 py-1.5 rounded-full ${scoreStatus.bg} ${scoreStatus.color} text-[10px] font-black tracking-[0.2em] mb-4`}>
                {scoreStatus.text}
            </span>
            <div className="flex items-baseline gap-1">
                <span className={`text-7xl md:text-8xl font-black tracking-tighter ${scoreStatus.color}`}>
                    {stats.score}%
                </span>
            </div>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-4">Overall Performance Score</p>
        </div>

        {/* Stat Cards Grid */}
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

        {/* Organized Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onReview} 
            className="col-span-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-sky-400" /> Review Answers
          </button>
          <button 
            onClick={initiateDownloadPDF} 
            className="col-span-1 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-500" /> Download PDF
          </button>
          <button 
            onClick={onReattempt} 
            className="col-span-1 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" /> Reattempt Quiz
          </button>
          <button 
            onClick={onRetry} 
            className="col-span-1 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-zinc-900 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-blue-500" /> Start New
          </button>
        </div>

        {/* History Button */}
        <button 
          onClick={onHistory}
          className="w-full py-4 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-zinc-200 active:scale-[0.98]"
        >
          <History className="w-4 h-4" /> View Quiz History
        </button>

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
