/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Microscope, FileText, Info, Loader2, ChevronRight, X, Camera, History, BookOpen, ExternalLink, Search, GraduationCap, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { analyzeHistologyImage } from './services/gemini';
import { PATHOLOGIES, Pathology } from './constants/pathologies';
import { LEARNING_MODULES, LearningModule, ModuleStep } from './constants/modules';

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
  const [sidebarTab, setSidebarTab] = useState<'analysis' | 'knowledge' | 'learning'>('analysis');
  const [selectedPathology, setSelectedPathology] = useState<Pathology | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
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
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden text-primary">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-lab-border flex items-center justify-between px-8 z-50 shrink-0 shadow-sm" style={{ backgroundColor: '#FBF8F7' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-inner">
            <Microscope size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-primary">MetszetMester</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#354B2F' }}>
              Egészségügyi Szövettani Oktató program
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-8 w-[1px] bg-lab-border" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 transition-all shadow-md active:scale-95 border border-black/5"
          >
            <Upload size={16} />
            Minta betöltése
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-accent/10 border-b border-accent/20 px-8 py-2 flex items-center justify-center gap-3 z-40">
        <AlertCircle size={14} className="text-accent" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Oktatási célú rendszer — Nem klinikai diagnózisra
        </p>
      </div>

      {/* Main Workbench Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: The Stage (Image Viewer) */}
        <section className="flex-1 p-8 flex items-center justify-center relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]">
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="workbench-panel p-12 max-w-lg text-center space-y-6 bg-white shadow-2xl border-secondary/20"
            >
              <div className="w-20 h-20 bg-accent/5 text-accent rounded-full flex items-center justify-center mx-auto border border-accent/10">
                <Upload size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-primary">Készen áll az elemzésre?</h2>
                <p className="text-sm text-primary/60 font-medium leading-relaxed">
                  Húzzon ide egy szövettani metszetet, vagy használja a fenti gombot a fájl kiválasztásához.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-4">
                <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full micro-label text-primary/60">Autofocus</div>
                <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full micro-label text-primary/60">AI Analysis</div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-full flex items-center justify-center p-4"
            >
              <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(15,23,42,0.2)] border-4 border-white bg-white">
                <img 
                  src={image} 
                  alt="Metszet" 
                  className="max-w-full max-h-[70vh] object-contain"
                  referrerPolicy="no-referrer"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-success" />
                      <p className="text-success font-mono text-xs uppercase tracking-widest font-bold">Scanning structures...</p>
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
            <div className="flex border-b border-lab-border bg-secondary/5">
              <button 
                onClick={() => setSidebarTab('analysis')}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                  sidebarTab === 'analysis' ? "border-accent text-accent bg-white" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <FileText size={12} />
                Elemzés
              </button>
              <button 
                onClick={() => setSidebarTab('knowledge')}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                  sidebarTab === 'knowledge' ? "border-accent text-accent bg-white" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <BookOpen size={12} />
                Tudástár
              </button>
              <button 
                onClick={() => setSidebarTab('learning')}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                  sidebarTab === 'learning' ? "border-accent text-accent bg-white" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <GraduationCap size={12} />
                Tanulás
              </button>
              <button 
                onClick={() => setSidebarTab('sources' as any)}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                  (sidebarTab as any) === 'sources' ? "border-accent text-accent bg-white" : "border-transparent text-primary/40 hover:text-primary/60"
                )}
              >
                <Info size={12} />
                Források
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
              ) : sidebarTab === 'knowledge' ? (
                <div className="p-6 space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={16} />
                    <input 
                      type="text"
                      placeholder="Keresés az elváltozások között..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/50 border border-lab-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
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
                          <h4 className="micro-label text-primary/30 px-1">{type}</h4>
                          <div className="grid gap-2">
                            {filtered.map(patho => (
                              <button
                                key={patho.id}
                                onClick={() => setSelectedPathology(selectedPathology?.id === patho.id ? null : patho)}
                                className={cn(
                                  "text-left p-4 rounded-xl border transition-all group",
                                  selectedPathology?.id === patho.id 
                                    ? "bg-accent text-white border-accent shadow-lg" 
                                    : "bg-white border-secondary/20 hover:border-accent/20 hover:bg-secondary/5"
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
              ) : (sidebarTab as any) === 'sources' ? (
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif font-bold text-primary">Szakmai Források</h3>
                    <p className="text-sm text-primary/60 leading-relaxed">
                      A rendszer az alábbi standard orvosi és patológiai források alapján épül fel, követve a nemzetközi irányelveket.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="micro-label text-accent">Standard Terminológia</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-xs text-primary/80">
                          <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                          WHO Classification of Tumours (Blue Books)
                        </li>
                        <li className="flex items-start gap-2 text-xs text-primary/80">
                          <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                          Standardized Pathology Nomenclature
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="micro-label text-accent">Ajánlott Tankönyvek</h4>
                      <div className="grid gap-2">
                        {[
                          "Robbins Basic Pathology",
                          "Wheater's Functional Histology",
                          "Junqueira's Basic Histology",
                          "Rosai and Ackerman's Surgical Pathology"
                        ].map(book => (
                          <div key={book} className="p-3 bg-secondary/5 border border-lab-border rounded-xl text-xs font-medium text-primary/70">
                            {book}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-accent">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Etikai Irányelv</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-accent/80 italic">
                        Az AI által generált elemzések szubjektívek lehetnek. A végleges diagnózis felállítása minden esetben szakképzett patológus feladata. A rendszer célja a differenciáldiagnosztikai szemlélet erősítése.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {!selectedModule ? (
                    <div className="space-y-8">
                      {Array.from(new Set(LEARNING_MODULES.map(m => m.category))).map(cat => (
                        <div key={cat} className="space-y-3">
                          <h4 className="micro-label text-primary/30 px-1">{cat}</h4>
                          <div className="grid gap-3">
                            {LEARNING_MODULES.filter(m => m.category === cat).map(module => (
                              <button
                                key={module.id}
                                onClick={() => {
                                  setSelectedModule(module);
                                  setCurrentStepIndex(0);
                                  setUserAnswer(null);
                                  setShowAnswer(false);
                                  if (module.steps[0].image) {
                                    setImage(module.steps[0].image);
                                  }
                                }}
                                className="text-left p-5 rounded-2xl bg-white border border-lab-border hover:border-accent/30 hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-serif font-bold text-primary group-hover:text-accent transition-colors">{module.title}</span>
                                  <ChevronRight size={16} className="text-primary/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                </div>
                                <p className="text-xs text-primary/60 leading-relaxed">{module.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <button 
                        onClick={() => setSelectedModule(null)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors"
                      >
                        <ArrowLeft size={12} /> Vissza a modulokhoz
                      </button>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="micro-label text-accent">{selectedModule.category}</span>
                          <span className="micro-label text-primary/30">{currentStepIndex + 1} / {selectedModule.steps.length}</span>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-primary">{selectedModule.steps[currentStepIndex].title}</h3>
                        <div className="h-1 bg-lab-border rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / selectedModule.steps.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <motion.div 
                        key={selectedModule.steps[currentStepIndex].id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="p-6 bg-secondary/5 rounded-2xl border border-lab-border">
                          <p className="text-sm leading-relaxed text-primary/80">
                            {selectedModule.steps[currentStepIndex].content}
                          </p>
                        </div>

                        {selectedModule.steps[currentStepIndex].type === 'question' && selectedModule.steps[currentStepIndex].question && (
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              {selectedModule.steps[currentStepIndex].question.options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  disabled={showAnswer}
                                  onClick={() => setUserAnswer(idx)}
                                  className={cn(
                                    "text-left p-4 rounded-xl border transition-all text-sm",
                                    userAnswer === idx 
                                      ? "border-accent bg-accent/5 font-bold" 
                                      : "border-lab-border hover:border-accent/20 bg-white",
                                    showAnswer && idx === selectedModule.steps[currentStepIndex].question?.correctIndex && "border-success bg-success/5 text-success",
                                    showAnswer && userAnswer === idx && idx !== selectedModule.steps[currentStepIndex].question?.correctIndex && "border-red-500 bg-red-50 text-red-500"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{opt}</span>
                                    {showAnswer && idx === selectedModule.steps[currentStepIndex].question?.correctIndex && <CheckCircle2 size={16} />}
                                    {showAnswer && userAnswer === idx && idx !== selectedModule.steps[currentStepIndex].question?.correctIndex && <AlertCircle size={16} />}
                                  </div>
                                </button>
                              ))}
                            </div>
                            
                            {!showAnswer ? (
                              <button 
                                disabled={userAnswer === null}
                                onClick={() => setShowAnswer(true)}
                                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all"
                              >
                                Válasz ellenőrzése
                              </button>
                            ) : (
                              <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                                <p className="text-xs text-success/80 leading-relaxed italic">
                                  {selectedModule.steps[currentStepIndex].question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4">
                          <button
                            disabled={currentStepIndex === 0}
                            onClick={() => {
                              const nextIdx = currentStepIndex - 1;
                              setCurrentStepIndex(nextIdx);
                              setUserAnswer(null);
                              setShowAnswer(false);
                              if (selectedModule.steps[nextIdx].image) {
                                setImage(selectedModule.steps[nextIdx].image);
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors disabled:opacity-0"
                          >
                            <ArrowLeft size={14} /> Előző
                          </button>
                          <button
                            onClick={() => {
                              if (currentStepIndex < selectedModule.steps.length - 1) {
                                const nextIdx = currentStepIndex + 1;
                                setCurrentStepIndex(nextIdx);
                                setUserAnswer(null);
                                setShowAnswer(false);
                                if (selectedModule.steps[nextIdx].image) {
                                  setImage(selectedModule.steps[nextIdx].image);
                                }
                              } else {
                                setSelectedModule(null);
                              }
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent/90 transition-all shadow-md"
                          >
                            {currentStepIndex < selectedModule.steps.length - 1 ? 'Következő' : 'Befejezés'} <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-lab-border bg-surface/20">
              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-lab-border shadow-sm">
                <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-primary/60 italic">
                  <strong>FONTOS:</strong> Ez egy oktatási célú rendszer. Az AI elemzések nem helyettesítik a klinikai diagnózist. Minden esetben konzultáljon szakorvossal.
                </p>
              </div>
            </div>
          </motion.aside>
        </AnimatePresence>
      </main>

      {/* Bottom Rail: History */}
      <footer className="h-24 bg-white border-t border-lab-border flex items-center px-8 gap-6 z-50 shrink-0">
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
                  image === item.image ? "border-accent shadow-lg scale-105" : "border-secondary/20 hover:border-accent/20"
                )}
              >
                <img src={item.image} className="w-full h-full object-cover" alt="History" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-accent/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(66, 133, 244, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-teal); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
