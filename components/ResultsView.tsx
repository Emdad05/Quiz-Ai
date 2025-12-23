
import React, { useMemo, useState } from 'react';
import { QuizResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

  const chartData = [
    { name: 'Correct', value: stats.correct, color: '#10b981' }, 
    { name: 'Wrong', value: stats.wrong, color: '#f43f5e' },    
    { name: 'Skipped', value: stats.skipped, color: '#D1D5DB' }, 
  ].filter(d => d.value > 0);

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
        doc.text("QUIZGENIUS AI", margin, 12);
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

    addPageHeader();
    yPos = 30;
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Assessment Report", margin, yPos);
    yPos += 15;
    doc.setFontSize(11);
    doc.text(`Title: ${result.title || "Untitled Assessment"}`, margin, yPos);
    yPos += 6;
    doc.text(`Candidate: ${userName || "User"}`, margin, yPos);
    yPos += 6;
    doc.text(`Score: ${stats.score}% (${stats.correct}/${stats.total})`, margin, yPos);
    yPos += 15;

    result.questions.forEach((q, i) => {
        const qText = `${i + 1}. ${q.questionText}`;
        const splitQ = doc.splitTextToSize(qText, maxLineWidth);
        checkPageBreak(splitQ.length * 6 + 20);
        doc.setFont("helvetica", "bold");
        doc.text(splitQ, margin, yPos);
        yPos += splitQ.length * 6 + 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Explanation: ${q.explanation.replace(/\*\*/g, '')}`, margin, yPos, { maxWidth: maxLineWidth });
        yPos += 15;
    });

    doc.save(`QuizResults_${Date.now()}.pdf`);
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

        {/* Buttons at Top - As Requested */}
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

        {/* Accuracy Circle Section */}
        <div className="bg-white rounded-3xl border border-zinc-50 p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] min-h-[240px] relative">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
              <span className={`text-4xl font-black tracking-tighter ${getScoreColor()}`}>{stats.score}%</span>
              <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em] mt-1">Accuracy</span>
            </div>
            <div className="relative z-10 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Background Track - Makes the circle clearly defined even if values are low */}
                  <Pie 
                    data={[{ value: 1 }]} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={62} 
                    outerRadius={72} 
                    dataKey="value" 
                    stroke="none" 
                    isAnimationActive={false}
                  >
                    <Cell fill="#F3F4F6" />
                  </Pie>
                  {/* Segments */}
                  <Pie 
                    data={chartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={62} 
                    outerRadius={72} 
                    paddingAngle={2} 
                    cornerRadius={100} 
                    dataKey="value" 
                    stroke="none" 
                    startAngle={90} 
                    endAngle={450}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stat Cards - Vertical Layout Based on Screenshot */}
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
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 border border-zinc-100 text-center">
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
