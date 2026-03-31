/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Microscope, FileText, Info, Loader2, ChevronRight, X, Camera, History, BookOpen, ExternalLink, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { analyzeHistologyImage } from './services/gemini';
import { PATHOLOGIES, Pathology } from './constants/pathologies';

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
  const [sidebarTab, setSidebarTab] = useState<'analysis' | 'knowledge'>('analysis');
  const [selectedPathology, setSelectedPathology] = useState<Pathology | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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
      setSidebarTab('analysis');
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

  const clearCurrent = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-surface overflow-hidden text-primary">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-lab-border bg-white/40 backdrop-blur-md flex items-center justify-between px-8 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <Microscope size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-primary">MetszetMester</h1>
            <p className="micro-label text-primary/60">Histology Workbench v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-8 w-[1px] bg-lab-border" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <Upload size={16} />
            Minta betöltése
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
      </header>

      {/* Main Workbench Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: The Stage (Image Viewer) */}
        <section className="flex-1 p-8 flex items-center justify-center relative bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:32px_32px]">
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="workbench-panel p-12 max-w-lg text-center space-y-6 bg-white/60"
            >
              <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/10">
                <Upload size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-primary">Készen áll az elemzésre?</h2>
                <p className="text-sm text-[#242120] font-medium leading-relaxed">
                  Húzzon ide egy szövettani metszetet, vagy használja a fenti gombot a fájl kiválasztásához.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-4">
                <div className="px-3 py-1 bg-white/50 border border-lab-border rounded-full micro-label">Autofocus</div>
                <div className="px-3 py-1 bg-white/50 border border-lab-border rounded-full micro-label">AI Analysis</div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-full flex items-center justify-center p-4"
            >
              <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(30,41,59,0.15)] border-4 border-white bg-white">
                <img 
                  src={image} 
                  alt="Metszet" 
                  className="max-w-full max-h-[70vh] object-contain"
                  referrerPolicy="no-referrer"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-primary" />
                      <p className="text-primary font-mono text-xs uppercase tracking-widest font-bold">Scanning structures...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Floating Image Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-white">
                <button onClick={clearCurrent} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Eltávolítás">
                  <X size={20} />
                </button>
                <div className="w-[1px] h-6 bg-lab-border" />
                <button className="p-2 hover:bg-surface text-primary rounded-lg transition-colors">
                  <Camera size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </section>

        {/* Right Side: Sidebar (Analysis & Knowledge Base) */}
        <AnimatePresence>
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[450px] bg-white/60 backdrop-blur-xl border-l border-lab-border flex flex-col shadow-2xl z-40 shrink-0"
          >
            {/* Sidebar Tabs */}
            <div className="flex border-b border-lab-border bg-surface/10">
              <button 
                onClick={() => setSidebarTab('analysis')}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                  sidebarTab === 'analysis' ? "border-primary text-primary bg-white/40" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <FileText size={14} />
                Elemzés
              </button>
              <button 
                onClick={() => setSidebarTab('knowledge')}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                  sidebarTab === 'knowledge' ? "border-primary text-primary bg-white/40" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <BookOpen size={14} />
                Tudástár
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {sidebarTab === 'analysis' ? (
                <div className="p-8">
                  {isAnalyzing ? (
                    <div className="space-y-6">
                      <div className="h-8 bg-primary/5 animate-pulse rounded-md w-3/4" />
                      <div className="space-y-3">
                        <div className="h-4 bg-primary/5 animate-pulse rounded-md w-full" />
                        <div className="h-4 bg-primary/5 animate-pulse rounded-md w-5/6" />
                        <div className="h-4 bg-primary/5 animate-pulse rounded-md w-4/6" />
                      </div>
                      <div className="h-32 bg-primary/5 animate-pulse rounded-xl w-full" />
                    </div>
                  ) : error ? (
                    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 space-y-4">
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={() => image && startAnalysis(image, 'image/jpeg')} className="text-xs font-bold underline uppercase tracking-widest">Újrapróbálás</button>
                    </div>
                  ) : result ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="markdown-body"
                    >
                      <Markdown>{result}</Markdown>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-sm">Töltsön be egy mintát az elemzés megtekintéséhez.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={16} />
                    <input 
                      type="text"
                      placeholder="Keresés az elváltozások között..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/50 border border-lab-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  {/* Pathology List */}
                  <div className="space-y-8">
                    {Array.from(new Set(PATHOLOGIES.map(p => p.tissueType))).map(type => {
                      const filtered = PATHOLOGIES.filter(p => 
                        p.tissueType === type && 
                        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      
                      if (filtered.length === 0) return null;

                      return (
                        <div key={type} className="space-y-3">
                          <h4 className="micro-label text-primary/40 px-1">{type}</h4>
                          <div className="grid gap-2">
                            {filtered.map(patho => (
                              <button
                                key={patho.id}
                                onClick={() => setSelectedPathology(selectedPathology?.id === patho.id ? null : patho)}
                                className={cn(
                                  "text-left p-4 rounded-xl border transition-all group",
                                  selectedPathology?.id === patho.id 
                                    ? "bg-primary text-white border-primary shadow-lg" 
                                    : "bg-white/40 border-lab-border hover:border-primary/20 hover:bg-white/60"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif font-bold">{patho.name}</span>
                                  <ChevronRight size={16} className={cn("transition-transform", selectedPathology?.id === patho.id && "rotate-90")} />
                                </div>
                                
                                <AnimatePresence>
                                  {selectedPathology?.id === patho.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-4 space-y-4">
                                        <p className="text-xs leading-relaxed opacity-90">
                                          {patho.description}
                                        </p>
                                        <div className="flex gap-2">
                                          {patho.imageLink && (
                                            <a 
                                              href={patho.imageLink} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Camera size={10} /> Kép
                                            </a>
                                          )}
                                          {patho.furtherReading && (
                                            <a 
                                              href={patho.furtherReading} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink size={10} /> Továbbiak
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-lab-border bg-surface/20">
              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-lab-border shadow-sm">
                <Info size={16} className="text-primary/40 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-primary/60 italic">
                  Ez a felület oktatási célokat szolgál. A leírások és elváltozások általános szövettani ismeretek, nem helyettesítik a szakorvosi diagnózist.
                </p>
              </div>
            </div>
          </motion.aside>
        </AnimatePresence>
      </main>

      {/* Bottom Rail: History */}
      <footer className="h-24 bg-white/40 backdrop-blur-md border-t border-lab-border flex items-center px-8 gap-6 z-50 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <History size={18} className="text-primary/40" />
          <span className="micro-label">History</span>
        </div>
        <div className="h-10 w-[1px] bg-lab-border shrink-0" />
        
        <div className="flex-1 flex gap-4 overflow-x-auto py-2 custom-scrollbar no-scrollbar">
          {history.length === 0 ? (
            <p className="text-xs text-primary/30 italic self-center">Nincsenek korábbi minták.</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setImage(item.image);
                  setResult(item.text);
                  setError(null);
                }}
                className={cn(
                  "h-14 w-14 shrink-0 rounded-lg border-2 transition-all overflow-hidden relative group",
                  image === item.image ? "border-primary shadow-lg scale-105" : "border-lab-border hover:border-primary/20"
                )}
              >
                <img src={item.image} className="w-full h-full object-cover" alt="History" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))
          )}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-teal); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
