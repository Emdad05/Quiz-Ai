import React from 'react';
import { ArrowLeft, Key, Database, Zap, BookOpen, Layers, Clock, Settings, FileText, Download, HelpCircle, ExternalLink, Cpu, ArrowRight, ShieldCheck, CheckCircle2, Copy, History, PieChart, Info, MessageSquare, Save, Lock, PlayCircle } from 'lucide-react';

interface HowToUseProps {
  onBack: () => void;
  onGoToApi: () => void;
  onStartGenerating: () => void;
}

const HowToUse: React.FC<HowToUseProps> = ({ onBack, onGoToApi, onStartGenerating }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
           <button onClick={onBack} className="flex items-center text-zinc-400 hover:text-white font-bold transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
           </button>
           <h1 className="text-lg font-bold text-zinc-300 tracking-tight">Support & Guide</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">
        
        {/* Intro */}
        <section className="text-center">
           <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">Mastering QuizGenius AI</h2>
           <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
               Your complete manual for generating, taking, and analyzing intelligent assessments.
           </p>
        </section>

        {/* 1. API Setup (Crucial) */}
        <section id="api-setup" className="scroll-mt-24 bg-gradient-to-b from-blue-900/10 to-transparent border border-blue-900/20 rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Key className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Key className="w-6 h-6" /></div>
                <h3 className="text-2xl font-bold tracking-tight">1. API Engine Configuration</h3>
            </div>
            
            <div className="space-y-8 text-zinc-300">
                <p className="text-zinc-400">
                    To power the AI, you need to provide your own Google Gemini API keys. This ensures you have high rate limits and full control over your generation costs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { step: "1", title: "Get Your Key", text: "Visit Google AI Studio and click 'Create API key'.", link: "https://aistudio.google.com/app/apikey" },
                      { step: "2", title: "Open Settings", text: "Click 'API Keys' in the app menu to open the manager." },
                      { step: "3", title: "Paste & Add", text: "Paste your key (starts with 'AIza') and click the '+' button." },
                      { step: "4", title: "Verify", text: "Our system will auto-validate the key before saving." }
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">{item.step}</div>
                        <div>
                            <h4 className="font-bold text-white mb-1">{item.title}</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">{item.text}</p>
                            {item.link && (
                                <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold mt-2 transition-colors">
                                    Open AI Studio <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex justify-center pt-4">
                    <button onClick={onGoToApi} className="group px-8 py-4 bg-white text-zinc-950 font-bold rounded-2xl transition-all shadow-xl flex items-center gap-2 hover:bg-zinc-200">
                        Go to API Manager <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </section>

        {/* 2. Generation & Input */}
        <section className="space-y-10">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/20"><Zap className="w-6 h-6" /></div>
                <h3 className="text-2xl font-bold tracking-tight">2. Intelligence Controls</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl group hover:border-zinc-600 transition-colors">
                    <FileText className="w-8 h-8 text-purple-400 mb-4" />
                    <h4 className="font-bold text-white mb-2">Multi-Source Input</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Paste text directly or upload <strong>PDFs and Images</strong>. The AI uses OCR to read handwriting and diagrams.
                    </p>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl group hover:border-zinc-600 transition-colors">
                    <Settings className="w-8 h-8 text-emerald-400 mb-4" />
                    <h4 className="font-bold text-white mb-2">Difficulty Tuning</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Choose from <strong>Easy, Medium, or Hard</strong>. The AI adapts language and logic complexity accordingly.
                    </p>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl group hover:border-zinc-600 transition-colors">
                    <Layers className="w-8 h-8 text-blue-400 mb-4" />
                    <h4 className="font-bold text-white mb-2">Quiz Types</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Switch between <strong>Multiple Choice</strong> and <strong>True/False</strong> formats to test different recall skills.
                    </p>
                </div>
            </div>
        </section>

        {/* 3. Review & Feedback */}
        <section className="bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-lg shadow-amber-600/20"><PieChart className="w-6 h-6" /></div>
                    <h3 className="text-2xl font-bold tracking-tight">3. Performance Analytics</h3>
                </div>
                
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-400" />
                                Detailed Review Mode
                            </h4>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                After finishing a quiz, enter <strong>Review Mode</strong> to see a step-by-step breakdown. 
                                We don't just show you the correct answer—the AI provides a <strong>contextual explanation</strong> 
                                highlighting why your answer was correct or incorrect, with key concepts bolded for fast revision.
                            </p>
                        </div>
                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-inner">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-emerald-500 uppercase">Correct Response</span>
                            </div>
                            <div className="space-y-2 opacity-50 select-none">
                                <div className="h-4 w-full bg-zinc-800 rounded"></div>
                                <div className="h-4 w-[80%] bg-zinc-800 rounded"></div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                                <p className="text-xs text-blue-300 italic">"The AI highlights **Key Phrases** so you remember them next time..."</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="order-2 md:order-1 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center">
                            <Download className="w-12 h-12 text-zinc-500 mb-4" />
                            <div className="w-full space-y-2">
                                <div className="h-2 w-full bg-zinc-800 rounded"></div>
                                <div className="h-2 w-full bg-zinc-800 rounded"></div>
                                <div className="h-2 w-[60%] bg-zinc-800 rounded"></div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5 text-emerald-400" />
                                PDF Exporting
                            </h4>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                Take your learning offline. Click the <strong>PDF Report</strong> button on the results screen to generate a professional, formatted document containing:
                            </p>
                            <ul className="mt-4 space-y-2">
                                {["Full list of questions & options", "Your answers vs correct answers", "Detailed AI explanations", "Performance score & timestamp"].map((txt, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {txt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. FAQs */}
        <section className="space-y-10">
            <div className="flex items-center justify-center gap-3 mb-6">
                <MessageSquare className="w-8 h-8 text-zinc-500" />
                <h3 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { q: "Is it free to use?", a: "The app itself is free! You only pay Google for the API usage if you exceed their free tier levels. Using your own keys ensures you have the highest possible priority." },
                  { q: "What happens if I close the tab?", a: "We have an auto-save engine. If you close the browser during a quiz, you'll see a 'Resume' button when you return. Your progress is stored locally." },
                  { q: "Can I upload handwritten notes?", a: "Yes! Upload a clear photo of your notes. Our Gemini models excel at vision processing and can extract text even from messy handwriting." },
                  { q: "Where is my data stored?", a: "Everything (API keys, history, answers) is stored strictly in your browser's LocalStorage. We do not have a server that stores your personal data." },
                  { q: "What if the AI fails to generate?", a: "Check your API keys first. If it persists, try reducing the 'Question Count' or simplifying the content you've pasted." },
                  { q: "What are 'Failover Logs'?", a: "If generation fails across all your keys, we show you a technical log. This helps you identify if a specific key is expired or rate-limited." }
                ].map((faq, i) => (
                  <div key={i} className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 hover:bg-zinc-900/60 transition-colors">
                    <h4 className="font-bold text-white mb-3 text-sm flex items-start gap-3">
                        <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        {faq.q}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed pl-7">{faq.a}</p>
                  </div>
                ))}
            </div>
        </section>

        {/* Footer Action */}
        <section className="pt-12 border-t border-zinc-900 flex flex-col items-center gap-8 text-center">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold">Ready to start?</h3>
                <p className="text-zinc-500 text-sm">Configure your engine and boost your learning productivity today.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={onGoToApi} className="px-10 py-4 bg-zinc-900 text-white font-bold rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                    <Key className="w-4 h-4" /> Setup Keys
                </button>
                <button onClick={onStartGenerating} className="px-10 py-4 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-xl">
                    <PlayCircle className="w-4 h-4" /> Start Generating
                </button>
            </div>

            <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> Secure Local Storage
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> Privacy Focused
                </div>
            </div>
        </section>

      </div>
      <footer className="py-12 bg-zinc-950/50 mt-20 border-t border-zinc-900">
          <p className="text-center text-zinc-600 text-xs font-medium">© {new Date().getFullYear()} QuizGenius AI Support Documentation.</p>
      </footer>
    </div>
  );
};

export default HowToUse;