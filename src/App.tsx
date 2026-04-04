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

const LOADING_MESSAGES = [
  "Struktúrák azonosítása...",
  "Sejtmagok detektálása...",
  "Szöveti mintázatok felismerése...",
  "Patológiai jelek keresése...",
  "Adatok összevetése az adatbázissal...",
  "Részletes jelentés összeállítása..."
];

function LoadingMessage() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-[10px] md:text-xs font-mono opacity-40 uppercase tracking-widest"
      >
        {LOADING_MESSAGES[index]}
      </motion.p>
    </AnimatePresence>
  );
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
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden selection:bg-primary/10 selection:text-primary flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 py-12 md:py-20 bg-grid relative flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto w-full">
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* Centered Logo & Title */}
              <div className="mb-12 md:mb-16 flex flex-col items-center gap-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="p-5 bg-gradient-to-br from-primary to-secondary text-white rounded-[2rem] shadow-[0_20px_40px_rgba(31,58,95,0.2)]"
                >
                  <Microscope size={48} strokeWidth={1.5} />
                </motion.div>
                <div className="space-y-2">
                  <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-primary">MetszetMester</h1>
                  <p className="text-xs md:text-sm uppercase tracking-[0.4em] opacity-40 font-mono font-bold">
                    Histology Educator <span className="italic normal-case font-medium ml-1">by Mékli Zsuzsanna</span>
                  </p>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-light mb-12 tracking-tight text-primary/70 max-w-2xl leading-relaxed">
                Fedezze fel a mikroszkópos világot egy digitális tanársegéd segítségével.
              </h2>

              {/* Centered Upload Area */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative glass-card w-full max-w-3xl p-12 md:p-20 transition-all hover:shadow-[0_40px_120px_rgba(31,58,95,0.1)] cursor-pointer border-2 border-dashed border-line hover:border-primary/30 micro-corners"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="flex flex-col items-center gap-8">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-gradient-to-br from-warm-beige to-off-white flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_10px_30px_rgba(0,0,0,0.03)]">
                    <Upload size={32} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl md:text-2xl font-medium text-primary">Húzza ide a metszetet</p>
                    <p className="text-xs md:text-sm opacity-30 font-mono tracking-widest uppercase">Vagy kattintson a tallózáshoz</p>
                  </div>
                </div>
              </div>

              {/* Minimal Footer Info */}
              <div className="mt-16 md:mt-24 flex gap-12 opacity-20 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                <span className="flex items-center gap-2"><Camera size={14} /> Digital Imaging</span>
                <span className="flex items-center gap-2"><FileText size={14} /> Academic Analysis</span>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-12 md:space-y-16">
              {/* Minimal Header when image is present */}
              <header className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer" onClick={clearCurrent}>
                  <div className="p-2 bg-primary text-white rounded-lg">
                    <Microscope size={18} />
                  </div>
                  <span className="font-serif font-bold text-primary">MetszetMester</span>
                </div>
                <button 
                  onClick={clearCurrent}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-line text-[10px] font-mono uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-sm"
                >
                  <Upload size={12} />
                  Új feltöltés
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
                {/* Image View */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-line bg-surface shadow-2xl p-3 md:p-6 relative micro-corners">
                    <img 
                      src={image} 
                      alt="Metszet" 
                      className="w-full h-full object-contain rounded-[2rem] md:rounded-[3rem]"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Scanning Animation Overlay */}
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-[2rem] md:rounded-[3rem]"
                        >
                          <motion.div 
                            className="absolute left-0 right-0 h-1 bg-secondary shadow-[0_0_20px_rgba(59,110,165,0.6)] z-20"
                            animate={{ 
                              top: ["0%", "100%", "0%"] 
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Analysis View */}
                <div className="space-y-8">
                  {isAnalyzing ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col items-center justify-center py-20 md:py-32 gap-8 text-center glass-card relative overflow-hidden micro-corners"
                    >
                      <div className="relative">
                        <Loader2 size={64} className="md:size-80 animate-spin text-secondary opacity-5" />
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Microscope size={40} className="text-secondary" />
                        </motion.div>
                      </div>
                      
                      <div className="space-y-4 z-10">
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-2xl md:text-3xl font-serif italic text-primary"
                        >
                          A struktúrák elemzése...
                        </motion.p>
                        <div className="flex flex-col gap-2">
                          <LoadingMessage />
                        </div>
                      </div>
                      
                      {/* Progress bar simulation */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-line">
                        <motion.div 
                          className="h-full bg-secondary"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 15, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  ) : error ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 md:p-12 bg-red-50/50 border border-red-100 rounded-[2.5rem] text-red-600 shadow-sm"
                    >
                      <h3 className="font-serif text-xl font-bold mb-3">Hiba történt</h3>
                      <p className="text-sm opacity-70 leading-relaxed mb-6">{error}</p>
                      <button 
                        onClick={() => startAnalysis(image, 'image/jpeg')}
                        className="px-6 py-3 bg-red-600 text-white rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                      >
                        Próbálja újra
                      </button>
                    </motion.div>
                  ) : result ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="markdown-body glass-card p-8 md:p-12 micro-corners"
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
    </div>
  );
}
