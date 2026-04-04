/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Microscope, FileText, Info, Loader2, ChevronRight, X, Camera, History, ZoomIn, ZoomOut, Maximize, Move, Anchor } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { analyzeHistologyImage, HistologyAnnotation } from './services/gemini';

const ThreeDMicroscope = ({ size = 24, className = "", strokeWidth = 1.2 }: { size?: number, className?: string, strokeWidth?: number }) => (
  <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
    <motion.div
      animate={{ 
        rotateY: [0, 15, 0, -15, 0],
        rotateX: [0, -8, 0, 8, 0],
        y: [0, -2, 0, 2, 0]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="relative preserve-3d"
    >
      {/* Deep Shadow */}
      <Microscope 
        size={size} 
        strokeWidth={strokeWidth} 
        className="absolute top-[6px] left-[4px] text-black/30 blur-[3px] opacity-40" 
      />
      
      {/* 3D Stacked Layers for Depth */}
      {[1, 2, 3].map((offset) => (
        <Microscope 
          key={offset}
          size={size} 
          strokeWidth={strokeWidth} 
          className="absolute text-primary/10" 
          style={{ transform: `translateZ(${-offset * 2}px) translate(${offset}px, ${offset}px)` }}
        />
      ))}

      {/* Inner Glow / Ambient Light */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <Microscope 
          size={size} 
          strokeWidth={strokeWidth + 0.8} 
          className="text-secondary/40 blur-[6px]" 
        />
      </motion.div>

      {/* Main Front Layer */}
      <div className="relative">
        <Microscope 
          size={size} 
          strokeWidth={strokeWidth} 
          className="relative text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" 
        />
        
        {/* Specular Highlight (The "Lens" Shine) */}
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.6, 0.2],
            x: [-10, 10, -10],
            y: [-10, 10, -10]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white/40 blur-[8px] rounded-full pointer-events-none"
        />
      </div>

      {/* Bottom Reflection / Base Glow */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-secondary/20 blur-[4px] rounded-full" />
    </motion.div>
  </div>
);

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
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFloating, setIsFloating] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'structures'>('report');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
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
    setSelectedAnnotationIndex(idx);
    setHoveredAnnotationIndex(idx);
    setZoom(2.5);
    
    // Calculate center of annotation in 0-1000 coordinates
    const centerX = (ann.xmin + ann.xmax) / 2;
    const centerY = (ann.ymin + ann.ymax) / 2;
    
    const targetX = (500 - centerX) * 0.8; 
    const targetY = (500 - centerY) * 0.8;
    
    setPan({ x: targetX, y: targetY });
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
    setResult(null);
    setActiveTab('report');
    try {
      const response = await analyzeHistologyImage(base64, mimeType);
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
    setSelectedAnnotationIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError(null);
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setImage(item.image);
    setResult(item.text);
    setAnnotations(item.annotations);
    setActiveTab('report');
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
                  className="p-5 bg-gradient-to-br from-primary to-secondary text-white rounded-[2rem] shadow-[0_20px_40px_rgba(31,58,95,0.2)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <ThreeDMicroscope size={48} strokeWidth={1.2} />
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
                  <div className="p-2 bg-gradient-to-br from-primary to-secondary text-white rounded-xl shadow-lg">
                    <ThreeDMicroscope size={18} strokeWidth={1.5} />
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
                {/* Image View - Sticky or Floating */}
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "relative group transition-all duration-500 z-40",
                    isFloating 
                      ? "fixed bottom-8 right-8 w-72 h-72 md:w-96 md:h-96 shadow-[0_30px_60px_rgba(0,0,0,0.2)] border-2 border-primary/20 rounded-[2.5rem] overflow-hidden bg-surface/90 backdrop-blur-xl" 
                      : "lg:col-span-7 lg:sticky lg:top-12"
                  )}
                  drag={isFloating}
                  dragMomentum={false}
                >
                  <div 
                    ref={containerRef}
                    onWheel={handleWheel}
                    className={cn(
                      "aspect-square overflow-hidden relative bg-surface/50 border border-line shadow-sm",
                      isFloating ? "rounded-[2.3rem]" : "rounded-[3rem] md:rounded-[4rem]"
                    )}
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
                                opacity: (hoveredAnnotationIndex === null && selectedAnnotationIndex === null) 
                                  ? 0.6 
                                  : (hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? 1 : 0.2),
                                scale: hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? 1.05 : 1
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
                                fill={hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? "rgba(59, 110, 165, 0.15)" : "transparent"}
                                stroke="currentColor"
                                strokeWidth={hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? 4 / zoom : 1.5 / zoom}
                                className={cn(
                                  "transition-all duration-300",
                                  hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? "text-secondary" : "text-primary/40"
                                )}
                              />
                              {(hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx || zoom > 2) && (
                                <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                  <rect 
                                    x={((ann.xmin + ann.xmax) / 2) - ((ann.label.length * 8 + 24) / (2 * zoom))} 
                                    y={ann.ymin - (45 / zoom)} 
                                    width={(ann.label.length * 8 + 24) / zoom} 
                                    height={32 / zoom} 
                                    rx={16 / zoom} 
                                    className="fill-secondary shadow-2xl"
                                  />
                                  <text 
                                    x={(ann.xmin + ann.xmax) / 2} 
                                    y={ann.ymin - (24 / zoom)} 
                                    textAnchor="middle"
                                    className="fill-white font-bold font-sans select-none"
                                    style={{ fontSize: `${13 / zoom}px` }}
                                  >
                                    {ann.label}
                                  </text>
                                  {/* Small pointer triangle */}
                                  <path 
                                    d={`M ${(ann.xmin + ann.xmax) / 2 - (6 / zoom)} ${ann.ymin - (14 / zoom)} L ${(ann.xmin + ann.xmax) / 2} ${ann.ymin - (4 / zoom)} L ${(ann.xmin + ann.xmax) / 2 + (6 / zoom)} ${ann.ymin - (14 / zoom)} Z`}
                                    className="fill-secondary"
                                  />
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
                      <div className="h-4 w-px bg-line mx-1" />
                      <button 
                        onClick={() => setIsFloating(!isFloating)}
                        className={cn(
                          "p-2 rounded-full transition-all duration-300",
                          isFloating ? "bg-primary text-white" : "hover:bg-primary/5 text-primary"
                        )}
                        title={isFloating ? "Dokkolás" : "Lebegő mód"}
                      >
                        {isFloating ? <Anchor size={16} /> : <Move size={16} />}
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
                <div className={cn(
                  "space-y-8 transition-all duration-500",
                  isFloating ? "lg:col-span-10 lg:col-start-2" : "lg:col-span-5"
                )}>
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
                          <div className="p-4 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl">
                            <ThreeDMicroscope size={40} strokeWidth={1.2} />
                          </div>
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
                    <div className="space-y-8">
                      {/* Tab Switcher - Prominent Panel Style */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-12">
                        <button
                          onClick={() => setActiveTab('report')}
                          className={cn(
                            "flex-1 py-6 px-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'report' 
                              ? "bg-primary border-primary text-white shadow-2xl scale-[1.02]" 
                              : "bg-surface border-line text-primary/40 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "p-4 rounded-2xl transition-colors",
                              activeTab === 'report' ? "bg-white/10" : "bg-primary/5"
                            )}>
                              <FileText size={28} />
                            </div>
                            <div>
                              <span className="block text-[10px] font-mono uppercase tracking-widest opacity-60 mb-1">Dokumentáció</span>
                              <h4 className="text-xl font-serif font-bold">Elemzési Jelentés</h4>
                            </div>
                          </div>
                          {activeTab === 'report' && (
                            <motion.div 
                              layoutId="tab-glow"
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab('structures')}
                          className={cn(
                            "flex-1 py-6 px-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'structures' 
                              ? "bg-primary border-primary text-white shadow-2xl scale-[1.02]" 
                              : "bg-surface border-line text-primary/40 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "p-4 rounded-2xl transition-colors",
                              activeTab === 'structures' ? "bg-white/10" : "bg-primary/5"
                            )}>
                              <ThreeDMicroscope 
                                size={28} 
                                strokeWidth={1.2} 
                                className={cn(activeTab === 'structures' ? "" : "[&_svg]:text-primary/40")} 
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] font-mono uppercase tracking-widest opacity-60 mb-1">Morfológia</span>
                              <h4 className="text-xl font-serif font-bold">Azonosított struktúrák</h4>
                            </div>
                          </div>
                          {activeTab === 'structures' && (
                            <motion.div 
                              layoutId="tab-glow"
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {activeTab === 'report' ? (
                          <motion.div 
                            key="report-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="p-4 md:p-0 relative overflow-hidden"
                          >
                            <div className="mb-8 border-b border-line pb-4">
                              <h3 className="font-serif text-2xl font-bold text-primary">Elemzési Jelentés</h3>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Histological Analysis</p>
                            </div>
                            <div className="markdown-body">
                              <Markdown>{result}</Markdown>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="structures-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-12"
                          >
                            <div className="mb-8 border-b border-line pb-4">
                              <h3 className="font-serif text-2xl font-bold text-primary">Azonosított struktúrák</h3>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Detailed Morphological Identification</p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                              {/* List of Descriptions with Micro-Crops */}
                              <div className="space-y-4">
                                {annotations.map((ann, idx) => (
                                  <motion.div
                                    key={idx}
                                    onMouseEnter={() => setHoveredAnnotationIndex(idx)}
                                    onMouseLeave={() => setHoveredAnnotationIndex(null)}
                                    onClick={() => focusAnnotation(ann, idx)}
                                    className={cn(
                                      "p-4 rounded-[2rem] border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                                      selectedAnnotationIndex === idx 
                                        ? "bg-secondary/5 border-secondary/30 shadow-md translate-x-2" 
                                        : "bg-surface border-line hover:border-primary/20"
                                    )}
                                  >
                                    <div className="flex items-center gap-5">
                                      {/* Micro-Crop Preview */}
                                      <div className={cn(
                                        "w-20 h-20 rounded-2xl overflow-hidden border transition-all duration-500 bg-black flex-shrink-0 relative",
                                        selectedAnnotationIndex === idx ? "border-secondary ring-4 ring-secondary/10" : "border-line"
                                      )}>
                                        <div 
                                          className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                          style={{
                                            backgroundImage: `url(${image})`,
                                            backgroundSize: '800%', // 8x zoom for thumbnail
                                            backgroundPosition: `${(((ann.xmin + ann.xmax) / 2000) * 8 - 0.5) / 7 * 100}% ${(((ann.ymin + ann.ymax) / 2000) * 8 - 0.5) / 7 * 100}%`,
                                            backgroundRepeat: 'no-repeat'
                                          }}
                                        />
                                        {selectedAnnotationIndex === idx && (
                                          <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 border-2 border-secondary/50 rounded-2xl"
                                          />
                                        )}
                                      </div>

                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className={cn(
                                            "text-lg font-serif font-bold transition-colors",
                                            selectedAnnotationIndex === idx ? "text-secondary" : "text-primary"
                                          )}>
                                            {ann.label}
                                          </span>
                                          {selectedAnnotationIndex === idx && (
                                            <div className="px-2 py-0.5 bg-secondary/10 text-secondary text-[8px] font-mono uppercase tracking-widest rounded-full">
                                              Fókuszban
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-primary/60 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                          {ann.description}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Sticky Zoomed Preview with Precision Overlay */}
                              <div className="xl:sticky xl:top-12 aspect-square rounded-[3rem] overflow-hidden bg-surface border border-line shadow-xl relative group">
                                <AnimatePresence mode="wait">
                                  <motion.div 
                                    key={selectedAnnotationIndex ?? 'none'}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full relative"
                                  >
                                    <motion.div 
                                      className="w-full h-full"
                                      animate={{ 
                                        scale: selectedAnnotationIndex !== null ? 3 : 1,
                                        x: selectedAnnotationIndex !== null ? (500 - (annotations[selectedAnnotationIndex].xmin + annotations[selectedAnnotationIndex].xmax) / 2) * 1.2 : 0,
                                        y: selectedAnnotationIndex !== null ? (500 - (annotations[selectedAnnotationIndex].ymin + annotations[selectedAnnotationIndex].ymax) / 2) * 1.2 : 0
                                      }}
                                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    >
                                      <img 
                                        src={image} 
                                        alt="Focus View" 
                                        className="w-full h-full object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    </motion.div>

                                    {/* Precision Crosshair Overlay */}
                                    {selectedAnnotationIndex !== null && (
                                      <>
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                          <div className="relative w-24 h-24">
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-secondary/30" />
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-secondary/30" />
                                            <div className="absolute inset-0 border border-secondary/20 rounded-full animate-pulse" />
                                          </div>
                                        </div>
                                        
                                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-8 bg-gradient-to-t from-black/60 to-transparent">
                                          <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-1"
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 bg-secondary rounded-full animate-ping" />
                                              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Precision Lock</span>
                                            </div>
                                            <h5 className="text-xl font-serif font-bold text-white">{annotations[selectedAnnotationIndex].label}</h5>
                                          </motion.div>
                                        </div>
                                      </>
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
