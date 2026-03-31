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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9fa] text-[#1a1a1a]">
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-r border-line bg-white p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent text-white rounded-lg">
            <Microscope size={24} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight">MetszetMester</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Histology Educator</p>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          <div className="text-[11px] font-mono uppercase opacity-50 tracking-wider">Navigáció</div>
          <button 
            onClick={clearCurrent}
            className="flex items-center gap-3 text-sm font-medium hover:text-accent transition-colors"
          >
            <Upload size={18} />
            Új feltöltés
          </button>
          <div className="flex items-center gap-3 text-sm font-medium opacity-50 cursor-not-allowed">
            <Info size={18} />
            Tudástár (Hamarosan)
          </div>
        </nav>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase opacity-50 tracking-wider">Előzmények</div>
            <History size={14} className="opacity-30" />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-xs italic opacity-40">Még nincs korábbi elemzés.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="w-full group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-line text-left"
                >
                  <img src={item.image} className="w-10 h-10 object-cover rounded border border-line" alt="Miniatűr" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Metszet #{item.id}</p>
                    <p className="text-[10px] opacity-40 font-mono">{item.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-line">
          <div className="p-4 bg-gray-50 rounded-xl border border-line">
            <p className="text-[10px] leading-relaxed opacity-60">
              <strong>Figyelem:</strong> Ez a program kizárólag oktatási célokat szolgál. Nem ad orvosi diagnózist.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid">
        <div className="max-w-4xl mx-auto">
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center"
            >
              <h2 className="text-4xl md:text-6xl font-serif font-light mb-6 tracking-tight">
                Fedezze fel a <span className="italic">mikroszkópos</span> világot.
              </h2>
              <p className="text-lg opacity-60 mb-12 max-w-xl mx-auto leading-relaxed">
                Töltsön fel egy szövettani metszetet, és a MetszetMester segít azonosítani a struktúrákat és megérteni a funkciókat.
              </p>

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-line rounded-3xl p-16 transition-all hover:border-accent hover:bg-white cursor-pointer"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Upload size={32} className="text-accent opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-medium">Húzza ide a képet vagy kattintson</p>
                    <p className="text-sm opacity-40 font-mono">JPG, PNG, TIFF (Max 10MB)</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
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
            <div className="space-y-12 pb-20">
              <div className="flex items-center justify-between">
                <button 
                  onClick={clearCurrent}
                  className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                  Vissza a kezdőlapra
                </button>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-white border border-transparent hover:border-line transition-all opacity-40 hover:opacity-100">
                    <Info size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Image View */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-3xl overflow-hidden border border-line bg-white shadow-2xl">
                    <img 
                      src={image} 
                      alt="Metszet" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-accent text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                    <Microscope size={20} />
                    <span className="text-xs font-mono uppercase tracking-widest">Aktív elemzés</span>
                  </div>
                </motion.div>

                {/* Analysis View */}
                <div className="space-y-8">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                      <Loader2 size={48} className="animate-spin text-accent opacity-20" />
                      <div className="space-y-2">
                        <p className="text-xl font-serif italic">Metszet elemzése folyamatban...</p>
                        <p className="text-xs font-mono opacity-40 uppercase tracking-widest">Struktúrák azonosítása • Szöveti típus meghatározása</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600">
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
                      className="markdown-body"
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
