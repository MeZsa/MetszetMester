/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Microscope, FileText, Info, Loader2, ChevronRight, X, Camera, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { analyzeHistologyImage } from './services/gemini';

interface AnalysisResult {
  id: string;
  image: string;
  text: string;
  timestamp: Date;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Kérjük, válasszon egy képfájlt!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      setResult(null);
      setError(null);
      startAnalysis(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const analysisText = await analyzeHistologyImage(base64, mimeType);
      setResult(analysisText);
      const newResult: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        image: base64,
        text: analysisText,
        timestamp: new Date(),
      };
      setHistory(prev => [newResult, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Hiba történt az elemzés során.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const clearCurrent = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setImage(item.image);
    setResult(item.text);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-ink overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 md:h-screen border-b md:border-r border-line bg-white/50 backdrop-blur-md p-4 md:p-6 flex flex-col gap-6 md:gap-8 shrink-0 sticky top-0 z-50 md:relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-accent to-accent/80 text-white rounded-xl shadow-[0_4px_12px_rgba(26,54,93,0.3)]">
            <Microscope size={24} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-accent">MetszetMester</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Histology Educator <span className="italic normal-case">by Mékli Zsuzsanna</span></p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
          <div className="hidden md:block text-[11px] font-mono uppercase opacity-50 tracking-wider">Navigáció</div>
          <button 
            onClick={clearCurrent}
            className="flex items-center gap-3 text-sm font-medium hover:text-accent transition-all group whitespace-nowrap"
          >
            <div className="p-2 rounded-lg bg-soft-blue text-accent group-hover:scale-110 transition-transform">
              <Upload size={18} />
            </div>
            Új feltöltés
          </button>
          <div className="flex items-center gap-3 text-sm font-medium opacity-50 cursor-not-allowed whitespace-nowrap">
            <div className="p-2 rounded-lg bg-gray-100">
              <Info size={18} />
            </div>
            Tudástár (Hamarosan)
          </div>
        </nav>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase opacity-50 tracking-wider">Előzmények</div>
            <History size={14} className="opacity-30" />
          </div>
          <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:custom-scrollbar pb-2 md:pb-0">
            {history.length === 0 ? (
              <p className="text-xs italic opacity-40 whitespace-nowrap">Még nincs korábbi elemzés.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="w-48 md:w-full group flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-line text-left shrink-0"
                >
                  <img src={item.image} className="w-10 h-10 object-cover rounded-lg border border-line shadow-sm" alt="Miniatűr" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Metszet #{item.id}</p>
                    <p className="text-[10px] opacity-40 font-mono">{item.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <ChevronRight size={14} className="hidden md:block opacity-0 group-hover:opacity-30 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="hidden md:block pt-6 border-t border-line">
          <div className="p-4 bg-soft-blue/50 rounded-2xl border border-line/50">
            <p className="text-[10px] leading-relaxed opacity-70 italic">
              <strong>Figyelem:</strong> Ez a program kizárólag oktatási célokat szolgál. Nem ad orvosi diagnózist.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto bg-grid relative">
        <div className="max-w-4xl mx-auto">
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 md:mt-12 text-center"
            >
              <h2 className="text-3xl md:text-6xl font-serif font-light mb-4 md:mb-6 tracking-tight text-primary">
                Fedezze fel a mikroszkópos világot.
              </h2>
              <p className="text-base md:text-lg opacity-60 mb-8 md:mb-12 max-w-xl mx-auto leading-relaxed">
                Töltsön fel egy szövettani metszetet, és a MetszetMester segít azonosítani a struktúrákat és megérteni a funkciókat.
              </p>

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative glass-card p-8 md:p-16 transition-all hover:shadow-[0_20px_50px_rgba(26,54,93,0.1)] cursor-pointer border-2 border-dashed border-line hover:border-accent/30"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-soft-blue to-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_10px_20px_rgba(0,0,0,0.05)]">
                    <Upload size={24} className="md:size-32 text-accent opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg md:text-xl font-medium text-accent">Húzza ide a képet vagy kattintson</p>
                    <p className="text-xs md:text-sm opacity-40 font-mono">JPG, PNG, TIFF (Max 10MB)</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 md:mt-12 flex flex-wrap justify-center gap-4 md:gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <Camera size={14} />
                  Mobile Ready
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <FileText size={14} />
                  PDF Export
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 md:y-12 pb-20">
              <div className="flex items-center justify-between">
                <button 
                  onClick={clearCurrent}
                  className="flex items-center gap-2 text-xs md:text-sm font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity text-accent"
                >
                  <X size={16} />
                  Vissza
                </button>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-white border border-transparent hover:border-line transition-all opacity-40 hover:opacity-100 text-accent">
                    <Info size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                {/* Image View */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-line bg-white shadow-2xl p-2 md:p-4">
                    <img 
                      src={image} 
                      alt="Metszet" 
                      className="w-full h-full object-contain rounded-[1.5rem] md:rounded-[2rem]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-gradient-to-br from-accent to-accent/90 text-white p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-2xl flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-white/20 rounded-lg md:rounded-xl">
                      <Microscope size={16} className="md:size-20" />
                    </div>
                    <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest font-bold">Aktív elemzés</span>
                  </div>
                </motion.div>

                {/* Analysis View */}
                <div className="space-y-6 md:space-y-8">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-20 gap-4 md:gap-6 text-center glass-card">
                      <Loader2 size={32} className="md:size-48 animate-spin text-accent opacity-20" />
                      <div className="space-y-2">
                        <p className="text-lg md:text-xl font-serif italic text-accent">Metszet elemzése...</p>
                        <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Struktúrák azonosítása</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-6 md:p-8 bg-red-50 border border-red-100 rounded-2xl md:rounded-3xl text-red-600 shadow-sm">
                      <h3 className="font-bold mb-2">Hiba történt</h3>
                      <p className="text-sm opacity-80">{error}</p>
                      <button 
                        onClick={() => startAnalysis(image, 'image/jpeg')}
                        className="mt-4 text-xs font-bold uppercase tracking-widest underline"
                      >
                        Próbálja újra
                      </button>
                    </div>
                  ) : result ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="markdown-body glass-card p-6 md:p-10"
                    >
                      <Markdown>{result}</Markdown>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


      <style dangerouslySetInnerHTML={{ __html: `
        .bg-grid {
          background-image: radial-gradient(var(--line) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}} />
    </div>
  );
}
