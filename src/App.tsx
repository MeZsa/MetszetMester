/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Microscope, FileText, Info, Loader2, ChevronRight, X, Camera, History, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { analyzeHistologyImage, HistologyAnnotation } from './services/gemini';

interface AnalysisResult {
  id: string;
  image: string;
  text: string;
  annotations: HistologyAnnotation[];
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
  const [annotations, setAnnotations] = useState<HistologyAnnotation[]>([]);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => {
    const newZoom = Math.max(prev - 0.5, 1);
    if (newZoom === 1) setPan({ x: 0, y: 0 });
    return newZoom;
  });
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const focusAnnotation = (ann: HistologyAnnotation, idx: number) => {
    setHoveredAnnotationIndex(idx);
    setZoom(2.5);
    
    // Calculate center of annotation in 0-1000 coordinates
    const centerX = (ann.xmin + ann.xmax) / 2;
    const centerY = (ann.ymin + ann.ymax) / 2;
    
    // Convert to pixel-ish offset (this is an approximation since we don't know container size exactly, 
    // but framer-motion drag will handle the relative movement)
    // We want to move the center of the image (500, 500) to the center of the annotation
    const targetX = (500 - centerX) * 0.8; // Scale factor for the pan
    const targetY = (500 - centerY) * 0.8;
    
    setPan({ x: targetX, y: targetY });
    
    // Scroll to top on mobile if needed, but on desktop it's sticky
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
  };

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
    setAnnotations([]);
    try {
     const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: base64,
    mimeType
  })
});

if (!response.ok) {
  throw new Error("A szerver nem tudta feldolgozni a kérést.");
}

const data = await response.json();

setResult(data.report);
setAnnotations(data.annotations);

const newResult: AnalysisResult = {
  id: Math.random().toString(36).substr(2, 9),
  image: base64,
  text: data.report,
  annotations: data.annotations,
  timestamp: new Date(),
};

setHistory(prev => [newResult, ...prev]);

      setResult(response.report);
      setAnnotations(response.annotations);
      const newResult: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        image: base64,
        text: response.report,
        annotations: response.annotations,
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
    setAnnotations([]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError(null);
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setImage(item.image);
    setResult(item.text);
    setAnnotations(item.annotations);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden selection:bg-primary/10 selection:text-primary flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 py-12 md:py-20 bg-grid relative flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">
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
                <div className="space-y-3">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="elegant-title text-6xl md:text-8xl"
                  >
                    MetszetMester
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] opacity-40 font-mono font-bold text-primary">
                      Histology Educator
                    </p>
                    <div className="h-px w-12 bg-primary/20 my-1" />
                    <p className="text-[9px] md:text-[10px] opacity-30 font-serif italic text-primary">
                      by Mékli Zsuzsanna
                    </p>
                  </motion.div>
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
                className="group relative w-full max-w-3xl p-12 md:p-20 transition-all cursor-pointer border-2 border-dashed border-primary/10 hover:border-primary/30 rounded-[3rem]"
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
                {/* Image View - Sticky on Desktop */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-7 lg:sticky lg:top-12 relative group"
                >
                  <div 
                    ref={containerRef}
                    onWheel={handleWheel}
                    className="aspect-square rounded-[3rem] md:rounded-[4rem] overflow-hidden relative bg-surface/50 border border-line shadow-sm"
                  >
                    <motion.div 
                      className="w-full h-full relative cursor-grab active:cursor-grabbing"
                      animate={{ 
                        scale: zoom,
                        x: pan.x,
                        y: pan.y
                      }}
                      drag={zoom > 1}
                      dragConstraints={containerRef}
                      onDragEnd={(_, info) => {
                        setPan(prev => ({
                          x: prev.x + info.offset.x,
                          y: prev.y + info.offset.y
                        }));
                      }}
                      dragElastic={0.1}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <img 
                        src={image} 
                        alt="Metszet" 
                        className="w-full h-full object-contain rounded-[2rem] md:rounded-[3rem] pointer-events-none"
                        referrerPolicy="no-referrer"
                      />

                      {/* Interactive Annotations Overlay */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none z-20"
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                      >
                        <AnimatePresence>
                          {annotations.map((ann, idx) => (
                            <motion.g
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: hoveredAnnotationIndex === null ? 0.6 : (hoveredAnnotationIndex === idx ? 1 : 0.2),
                                scale: hoveredAnnotationIndex === idx ? 1.05 : 1
                              }}
                              exit={{ opacity: 0 }}
                              className="pointer-events-auto cursor-pointer"
                              onMouseEnter={() => setHoveredAnnotationIndex(idx)}
                              onMouseLeave={() => setHoveredAnnotationIndex(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                focusAnnotation(ann, idx);
                                // Scroll to the specific annotation card in the list
                                const element = document.getElementById(`ann-card-${idx}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                            >
                              <rect
                                x={ann.xmin}
                                y={ann.ymin}
                                width={ann.xmax - ann.xmin}
                                height={ann.ymax - ann.ymin}
                                fill={hoveredAnnotationIndex === idx ? "rgba(59, 110, 165, 0.1)" : "transparent"}
                                stroke="currentColor"
                                strokeWidth={hoveredAnnotationIndex === idx ? 3 / zoom : 1.5 / zoom}
                                className={cn(
                                  "transition-all duration-300",
                                  hoveredAnnotationIndex === idx ? "text-secondary" : "text-primary/40"
                                )}
                              />
                              {(hoveredAnnotationIndex === idx || zoom > 2) && (
                                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                  <rect 
                                    x={ann.xmin} 
                                    y={ann.ymin - (35 / zoom)} 
                                    width={120 / zoom} 
                                    height={30 / zoom} 
                                    rx={4 / zoom} 
                                    className="fill-secondary shadow-lg"
                                  />
                                  <text 
                                    x={ann.xmin + (10 / zoom)} 
                                    y={ann.ymin - (15 / zoom)} 
                                    className="fill-white font-bold font-sans"
                                    style={{ fontSize: `${14 / zoom}px` }}
                                  >
                                    {ann.label}
                                  </text>
                                </motion.g>
                              )}
                            </motion.g>
                          ))}
                        </AnimatePresence>
                      </svg>
                    </motion.div>
                    
                    {/* Zoom Controls Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/90 backdrop-blur-md rounded-full border border-line shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <button 
                        onClick={handleZoomOut}
                        className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors"
                        title="Kicsinyítés"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <div className="h-4 w-px bg-line mx-1" />
                      <span className="text-[10px] font-mono font-bold text-primary min-w-[3ch] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <div className="h-4 w-px bg-line mx-1" />
                      <button 
                        onClick={handleZoomIn}
                        className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors"
                        title="Nagyítás"
                      >
                        <ZoomIn size={16} />
                      </button>
                      <button 
                        onClick={resetZoom}
                        className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors ml-1"
                        title="Alaphelyzet"
                      >
                        <Maximize size={16} />
                      </button>
                    </div>

                    {/* Sample Metadata Overlay */}
                    <div className="absolute top-10 left-10 flex flex-col gap-1 pointer-events-none z-30">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Sample ID</span>
                      <span className="text-xs font-mono font-bold text-primary/60">#HISTO-{Math.floor(Math.random() * 10000)}</span>
                    </div>

                    <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 pointer-events-none z-30">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Magnification</span>
                      <span className="text-xs font-mono font-bold text-secondary">{zoom > 1 ? `${zoom}x Digital` : 'Standard View'}</span>
                    </div>
                    
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
                <div className="lg:col-span-5 space-y-8">
                  {isAnalyzing ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col items-center justify-center py-20 md:py-32 gap-8 text-center relative overflow-hidden"
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
                      className="p-4 md:p-0 relative overflow-hidden"
                    >
                      <div className="mb-8 border-b border-line pb-4">
                        <h3 className="font-serif text-2xl font-bold text-primary">Elemzési Jelentés</h3>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Histological Analysis</p>
                      </div>
                      <div className="markdown-body">
                        <Markdown>{result}</Markdown>
                      </div>

                      {/* Interactive Structure List */}
                      {annotations.length > 0 && (
                        <div className="mt-12 space-y-6">
                          <h4 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                            <Info size={18} className="text-secondary" />
                            Azonosított struktúrák
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            {annotations.map((ann, idx) => (
                              <motion.div
                                key={idx}
                                id={`ann-card-${idx}`}
                                onMouseEnter={() => setHoveredAnnotationIndex(idx)}
                                onMouseLeave={() => setHoveredAnnotationIndex(null)}
                                onClick={() => focusAnnotation(ann, idx)}
                                className={cn(
                                  "p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                                  hoveredAnnotationIndex === idx 
                                    ? "bg-secondary/10 border-secondary/30 translate-x-2" 
                                    : "bg-primary/5 border-primary/5"
                                )}
                              >
                                <div className="flex items-center gap-3 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    hoveredAnnotationIndex === idx ? "bg-secondary" : "bg-primary/30"
                                  )} />
                                  <span className="font-bold text-primary">{ann.label}</span>
                                </div>
                                <p className="text-sm text-primary/60 pl-5 leading-relaxed">
                                  {ann.description}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
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
