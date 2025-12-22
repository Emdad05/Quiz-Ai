import React, { useState, useRef, useEffect } from 'react';
import { Menu, Home, Settings, BookOpen, Mail, X, ExternalLink, Key, Send } from 'lucide-react';

interface AppMenuProps {
  onHome: () => void;
  onHowToUse: () => void;
  onSetupApi: () => void;
  onContact: () => void;
}

const AppMenu: React.FC<AppMenuProps> = ({ onHome, onHowToUse, onSetupApi, onContact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
      action();
      setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="py-2">
            <button 
                onClick={() => handleAction(onHome)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
            >
                <Home className="w-4 h-4" /> Home
            </button>
            <button 
                onClick={() => handleAction(onSetupApi)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
            >
                <Key className="w-4 h-4" /> Setup API Keys
            </button>
            <button 
                onClick={() => handleAction(onHowToUse)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
            >
                <BookOpen className="w-4 h-4" /> How to Use
            </button>
            <button 
                onClick={() => handleAction(onContact)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
            >
                <Mail className="w-4 h-4" /> Contact Us
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppMenu;