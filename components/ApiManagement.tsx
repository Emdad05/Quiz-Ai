import React, { useState, useEffect, useRef } from 'react';
import { Key, Plus, Trash2, Save, ShieldCheck, Server, AlertTriangle, ArrowRight, CheckCircle2, Lock, ArrowLeft, Loader2, X, HelpCircle } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface ApiManagementProps {
  onContinue: () => void;
  onBack: () => void;
  onNeedHelp: () => void;
}

const ApiManagement: React.FC<ApiManagementProps> = ({ onContinue, onBack, onNeedHelp }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Delete Confirmation State
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    // Focus the input field on mount
    if (inputRef.current) {
        inputRef.current.focus();
    }

    try {
      const stored = localStorage.getItem('user_gemini_keys');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setKeys(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveKeys = (newKeys: string[]) => {
    setKeys(newKeys);
    localStorage.setItem('user_gemini_keys', JSON.stringify(newKeys));
  };

  const handleAdd = async () => {
    setErrorMsg(null);
    const trimmedInput = currentInput.trim();
    
    if (trimmedInput.length < 10) {
      setErrorMsg("Key looks too short.");
      return;
    }

    setIsValidating(true);
    const isValid = await validateApiKey(trimmedInput);
    setIsValidating(false);

    if (isValid) {
      const newKeys = [...keys, trimmedInput];
      saveKeys(newKeys);
      setCurrentInput('');
      // Refocus after adding
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setErrorMsg("Invalid API Key. Please check the key and try again.");
    }
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const newKeys = keys.filter((_, i) => i !== deleteIndex);
      saveKeys(newKeys);
      setDeleteIndex(null);
    }
  };

  const maskKey = (key: string) => {
    if (key.length < 10) return key;
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans relative">
      {/* Delete Confirmation Modal */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Remove API Key?</h3>
            </div>
            <p className="text-zinc-400 mb-6 text-sm">
              Are you sure you want to remove this API key from your local storage? You will need to re-add and re-validate it later.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteIndex(null)}
                className="flex-1 py-2.5 text-zinc-300 font-bold hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
            <button 
                onClick={onBack}
                className="flex items-center text-zinc-400 hover:text-white font-bold transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
        </div>

        <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Key className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">API Key Configuration</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Add your personal Google Gemini API keys to power the application. 
                Using your own keys ensures higher rate limits and personal usage tracking.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Input Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <h2 className="font-bold text-lg">Manage Keys</h2>
                    </div>
                    <button 
                        onClick={onNeedHelp}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors underline underline-offset-4 decoration-blue-400/30"
                    >
                        <HelpCircle className="w-3 h-3" /> How to get API keys?
                    </button>
                </div>

                <div className="flex gap-2 mb-2">
                    <input 
                        ref={inputRef}
                        type="password" 
                        value={currentInput}
                        onChange={(e) => { setCurrentInput(e.target.value); setErrorMsg(null); }}
                        placeholder="Paste Gemini API Key (AIza...)"
                        disabled={isValidating}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleAdd(); }}
                    />
                    <button 
                        onClick={handleAdd}
                        disabled={!currentInput || isValidating}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center min-w-[3.5rem]"
                        title="Add and Validate Key"
                    >
                        {isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </button>
                </div>
                {errorMsg && (
                    <div className="text-red-400 text-xs mb-4 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertTriangle className="w-3 h-3" /> {errorMsg}
                    </div>
                )}

                {keys.length === 0 ? (
                     <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-lg mt-4">
                        <p className="text-zinc-500 text-sm">No custom keys added.</p>
                        <p className="text-xs text-zinc-600 mt-1">
                            You must add at least one key to save this configuration. <br/>
                            Otherwise, go back and use "Get Started" for internal keys.
                        </p>
                     </div>
                ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mt-4">
                        {keys.map((key, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-mono text-blue-400">
                                        {idx + 1}
                                    </div>
                                    <span className="font-mono text-zinc-300 text-sm">{maskKey(key)}</span>
                                </div>
                                <button 
                                  onClick={() => setDeleteIndex(idx)} 
                                  className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/20 transition-all"
                                  title="Remove Key"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                    <Lock className="w-3 h-3" />
                    Keys are validated before saving and stored strictly in your browser's LocalStorage.
                </div>
            </div>

            {/* Diagram Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-6 relative z-10">
                    <Server className="w-5 h-5 text-purple-500" />
                    <h2 className="font-bold text-lg">Failover Logic</h2>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full pb-6 space-y-4">
                    {/* User Node */}
                    <div className="flex flex-col items-center">
                        <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 text-sm font-mono text-zinc-300">
                            Request
                        </div>
                        <div className="h-6 w-px bg-zinc-700"></div>
                        <ArrowRight className="w-4 h-4 text-zinc-700 rotate-90" />
                    </div>

                    {/* Keys Logic */}
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-dashed border-zinc-700 w-full">
                        <p className="text-xs text-center text-zinc-500 mb-3 uppercase tracking-wider font-bold">Key Rotation System</p>
                        <div className="flex items-center justify-center gap-2">
                             {[1, 2, 3].map((i) => (
                                 <div key={i} className="flex items-center">
                                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center border text-xs font-bold ${keys.length >= i ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                                         Key {i}
                                     </div>
                                     {i < 3 && <div className="w-4 h-0.5 bg-zinc-800 mx-1"></div>}
                                 </div>
                             ))}
                             <span className="ml-2 text-zinc-600 text-xs">...</span>
                        </div>
                    </div>

                    {/* Failover Arrow */}
                    <div className="flex flex-col items-center">
                        <ArrowRight className="w-4 h-4 text-zinc-700 rotate-90" />
                        <div className="h-6 w-px bg-zinc-700"></div>
                    </div>

                    {/* Model Fallback */}
                    <div className="flex gap-3 text-xs">
                        <div className="bg-purple-900/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-full">Gemini Pro</div>
                        <span className="text-zinc-600 mt-1">→</span>
                        <div className="bg-indigo-900/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full">Gemini Flash</div>
                        <span className="text-zinc-600 mt-1">→</span>
                        <span className="text-zinc-500 mt-1">...</span>
                    </div>
                </div>

                <div className="mt-6 text-xs text-zinc-400 leading-relaxed text-center relative z-10 bg-zinc-950/50 p-3 rounded-lg">
                    The system automatically tries <strong>Key 1</strong>. If rate-limited (429), it retries with <strong>Key 2</strong>. If all keys fail, it cycles through available fallback models.
                </div>
            </div>
        </div>

        <div className="flex justify-center">
            <button 
                onClick={onContinue}
                disabled={keys.length === 0}
                className="group relative px-8 py-4 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="relative z-10">Save & Continue</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApiManagement;