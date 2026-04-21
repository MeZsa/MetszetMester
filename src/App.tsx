/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Info, Loader2, ChevronRight, X, Camera, History, ZoomIn, ZoomOut, Maximize, Move, Anchor, Brain, Trophy, CheckCircle2, XCircle, Sun, Moon, ChevronUp, ChevronDown, ChevronLeft, BookOpen, Play, Microscope, ArrowLeft, AlertTriangle, Download, Search } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import Markdown from 'react-markdown';
import { translations, Language } from './i18n';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { analyzeHistologyImage, HistologyAnnotation, generateHistologyQuiz, HistologyQuizQuestion, ClinicalCause, interpretMedicalReport, ReportInterpretationResponse, interpretMedicalReportFromFile } from './services/gemini';

const ScientificLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          rotateZ: [0, 0.5, 0, -0.5, 0]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative flex items-center justify-center w-full h-full"
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_15px_35px_var(--shadow-color)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="glassGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="0.6" />
              <stop offset="40%" stopColor="var(--color-surface)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.3" />
            </radialGradient>
            
            <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0.3" />
            </linearGradient>

            {/* Enhanced Neon Blue gradient */}
            <linearGradient id="blueStreamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2ff" />
              <stop offset="50%" stopColor="#34a3e3" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>

            <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.5" result="blur1" />
              <feGaussianBlur stdDeviation="4" result="blur2" />
              <feGaussianBlur stdDeviation="8" result="blur3" />
              <feColorMatrix in="blur3" type="matrix" values="0 0 0 0 0  0 0 0 0 0.95  0 0 0 0 1  0 0 0 0.4 0" result="glow3" />
              <feMerge>
                <feMergeNode in="glow3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Neon Aura (Static soft glow) */}
          <circle
            cx="50" cy="50"
            r="46.5"
            stroke="#00f2ff"
            strokeWidth="0.5"
            opacity="0.15"
            filter="blur(4px)"
          />

          {/* Continuous Glowing Neon Light Stream */}
          <motion.circle
            cx="50" cy="50"
            r="46.5"
            stroke="url(#blueStreamGradient)"
            strokeWidth="1.0"
            strokeLinecap="round"
            filter="url(#neonGlow)"
            animate={{ 
              rotate: [0, 360],
              opacity: [0.8, 1, 0.8],
              strokeWidth: [0.9, 1.3, 0.9]
            }}
            transition={{ 
              rotate: { duration: 7, repeat: Infinity, ease: "linear" },
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              strokeWidth: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Secondary Faster Pulse (Enhanced Spark) */}
          <motion.circle
            cx="50" cy="50"
            r="46.5"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="3 289"
            opacity="0.8"
            animate={{ 
              rotate: [360, 0],
              opacity: [0.5, 0.9, 0.5]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Glass Sphere Body */}
          <circle cx="50" cy="50" r="44" fill="url(#glassGradient)" stroke="url(#rimLight)" strokeWidth="0.8" />
          
          {/* AI Data Points & Connections (Subtle) */}
          <motion.g
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="42" cy="42" r="1" fill="white" />
            <circle cx="58" cy="48" r="1" fill="white" />
            <circle cx="52" cy="62" r="1" fill="white" />
            <circle cx="38" cy="55" r="1" fill="white" />
            <path d="M42 42L58 48M58 48L52 62M52 62L38 55M38 55L42 42" stroke="white" strokeWidth="0.2" opacity="0.3" />
          </motion.g>

          <motion.circle 
            cx="50" cy="50" r="32" 
            fill="url(#innerGlow)" 
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Refined & Elegant Microscope Symbol (Based on the structure of the user's drawing) */}
          <g transform="translate(25.8, 29.1) scale(0.44)" stroke="var(--deep-blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            {/* Base - Elegant and stable */}
            <path d="M15 90 H85" strokeWidth="6" />
            <path d="M50 90 V82" strokeWidth="6" />
            
            {/* Support & Mirror area - Refined */}
            <circle cx="42" cy="78" r="3.5" fill="var(--deep-blue)" stroke="none" />
            
            {/* Stage - Precision platform */}
            <path d="M22 68 H65" strokeWidth="4.5" />
            
            {/* Arm - Elegant architectural curve */}
            <path d="M80 82 C 80 82 95 65 95 40 C 95 15 80 5 55 5" fill="none" strokeWidth="5.5" />
            
            {/* Tube Assembly - Sophisticated shapes */}
            <g transform="translate(50, 35) rotate(-18)">
              {/* Eyepiece */}
              <rect x="-8" y="-38" width="16" height="8" rx="1.5" fill="var(--deep-blue)" stroke="none" />
              {/* Main Tube */}
              <rect x="-10" y="-30" width="20" height="48" rx="2" fill="var(--deep-blue)" stroke="none" />
              {/* Revolving Nosepiece */}
              <circle cx="0" cy="22" r="10" fill="var(--deep-blue)" stroke="none" />
              <circle cx="0" cy="22" r="4" fill="white" opacity="0.15" stroke="none" />
              {/* Objectives - Multiple for detail */}
              <rect x="-4" y="32" width="8" height="14" rx="1" fill="var(--deep-blue)" stroke="none" />
              <rect x="6" y="28" width="6" height="10" rx="1" transform="rotate(25 9 33)" fill="var(--deep-blue)" stroke="none" opacity="0.7" />
            </g>
            
            {/* Adjustment Knobs - Adding detail */}
            <circle cx="80" cy="65" r="5" fill="var(--deep-blue)" stroke="none" />
            <circle cx="80" cy="55" r="3" fill="var(--deep-blue)" stroke="none" opacity="0.6" />
          </g>

          {/* Glass Highlights & Reflections */}
          <ellipse cx="30" cy="26" rx="14" ry="8" fill="white" opacity="0.3" transform="rotate(-35 30 26)" />
          <path d="M72 72C78 66 82 54 78 42" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
          <circle cx="35" cy="35" r="2.5" fill="white" opacity="0.4" />
        </svg>
      </motion.div>
    </div>
  );
};

interface AnalysisResult {
  id: string;
  image: string;
  text: string;
  annotations: HistologyAnnotation[];
  clinicalCauses: ClinicalCause[];
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
  const [view, setViewInternal] = useState<'main' | 'clinical' | 'report_interpreter' | 'terms'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'main' || hash === 'clinical' || hash === 'report_interpreter' || hash === 'terms') {
        return hash as 'main' | 'clinical' | 'report_interpreter' | 'terms';
      }
    }
    return 'main';
  });

  const setView = (newView: 'main' | 'clinical' | 'report_interpreter' | 'terms') => {
    window.location.hash = newView;
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'main' || hash === 'clinical' || hash === 'report_interpreter' || hash === 'terms') {
        setViewInternal(hash as 'main' | 'clinical' | 'report_interpreter' | 'terms');
      } else {
        setViewInternal('main');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // Beállítjuk a kezdeti hash-t, ha nincs
    if (!window.location.hash) {
       window.history.replaceState(null, '', '#main');
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('metszetmester-theme');
      return (saved as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('metszetmester-terms-accepted') === 'true';
    }
    return false;
  });

  const [termsCheckboxChecked, setTermsCheckboxChecked] = useState(false);

  React.useEffect(() => {
    localStorage.setItem('metszetmester-theme', theme);
  }, [theme]);

  const handleAcceptTerms = () => {
    localStorage.setItem('metszetmester-terms-accepted', 'true');
    setHasAcceptedTerms(true);
  };

  const t = translations['hu'];

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<HistologyAnnotation[]>([]);
  const [clinicalCauses, setClinicalCauses] = useState<ClinicalCause[]>([]);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [structureSearch, setStructureSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFloating, setIsFloating] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'structures' | 'quiz' | 'clinical'>('report');
  const [quizQuestions, setQuizQuestions] = useState<HistologyQuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report Interpreter State
  const [reportText, setReportText] = useState('');
  const [reportFileBase64, setReportFileBase64] = useState<string | null>(null);
  const [reportFileType, setReportFileType] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretationResult, setInterpretationResult] = useState<ReportInterpretationResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReportText(e.target?.result as string);
        setReportFileBase64(null);
        setReportFileType(null);
        setReportFileName(null);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setReportFileBase64(base64);
        setReportFileType(file.type);
        setReportFileName(file.name);
        setReportText(`[Feltöltött fájl: ${file.name}]`);
        setInterpretationResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Kérjük, válasszon egy szöveges fájlt (.txt), képet (.jpg, .jpeg, .png) vagy PDF-et!');
    }
    
    // Reset input
    if (reportFileInputRef.current) {
      reportFileInputRef.current.value = '';
    }
  };

  const handleInterpretReport = async () => {
    if (!reportText.trim() && !reportFileBase64) return;
    
    setIsInterpreting(true);
    setError(null);
    try {
      let result;
      if (reportFileBase64 && reportFileType) {
        result = await interpretMedicalReportFromFile(reportFileBase64, reportFileType);
      } else {
        result = await interpretMedicalReport(reportText);
      }
      setInterpretationResult(result);
    } catch (err: any) {
      setError(err.message || 'Hiba történt a lelet értelmezése során.');
    } finally {
      setIsInterpreting(false);
    }
  };

  const exportToPDF = async () => {
    if (!image || !result) return;
    setIsExporting(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // 1. Add Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("MetszetMester - Szovettani Elemzes", margin, margin + 5);
      
      // 2. Add Image
      const imgProps = doc.getImageProperties(image);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let currentY = margin + 15;
      doc.addImage(image, 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
      
      // 3. Add Report Content via html2canvas
      const reportElement = document.getElementById('report-content-to-pdf');
      if (reportElement) {
        // Temporarily adjust styles for better PDF rendering
        const originalColor = reportElement.style.color;
        reportElement.style.color = '#000000'; // Ensure text is black for PDF
        
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // Restore styles
        reportElement.style.color = originalColor;
        
        const reportImgData = canvas.toDataURL('image/jpeg', 1.0);
        const reportImgProps = doc.getImageProperties(reportImgData);
        const reportImgWidth = pageWidth - 2 * margin;
        const reportImgHeight = (reportImgProps.height * reportImgWidth) / reportImgProps.width;
        
        let heightLeft = reportImgHeight;
        let position = currentY;
        
        doc.addImage(reportImgData, 'JPEG', margin, position, reportImgWidth, reportImgHeight);
        heightLeft -= (pageHeight - position);
        
        while (heightLeft >= 0) {
          position = heightLeft - reportImgHeight + margin;
          doc.addPage();
          doc.addImage(reportImgData, 'JPEG', margin, position, reportImgWidth, reportImgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      doc.save("szovettani_elemzes.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
      setError("Hiba történt a PDF generálása során.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportInterpretationToPDF = async () => {
    if (!interpretationResult) return;
    setIsExporting(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("MetszetMester - Leletertelmezes", margin, margin + 5);
      
      const reportElement = document.getElementById('interpretation-content-to-pdf');
      if (reportElement) {
        const originalColor = reportElement.style.color;
        reportElement.style.color = '#000000';
        
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        reportElement.style.color = originalColor;
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        let currentY = margin + 15;
        let heightLeft = imgHeight;
        let position = currentY;
        
        doc.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position);
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + margin;
          doc.addPage();
          doc.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      doc.save("leletertelmezes.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
      setError("Hiba történt a PDF generálása során.");
    } finally {
      setIsExporting(false);
    }
  };

  const processedResult = React.useMemo(() => {
    if (!result || !annotations.length) return result;
    
    let text = result;
    const sortedAnns = [...annotations]
      .map((ann, idx) => ({ ...ann, originalIndex: idx }))
      .sort((a, b) => b.label.length - a.label.length);
      
    const placeholders: { placeholder: string, value: string }[] = [];
    
    sortedAnns.forEach((ann) => {
      const escapedLabel = ann.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the label as a whole word, including Hungarian characters
      const regex = new RegExp(`(?<![a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ])${escapedLabel}(?![a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ])`, 'gi');
      
      text = text.replace(regex, (match) => {
        const placeholder = `__ANN_PLACEHOLDER_${placeholders.length}__`;
        placeholders.push({
          placeholder,
          value: `[${match}](annotation:${ann.originalIndex})`
        });
        return placeholder;
      });
    });
    
    placeholders.forEach(({ placeholder, value }) => {
      text = text.replace(placeholder, value);
    });
    
    return text;
  }, [result, annotations]);

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 50 / zoom;
    setPan(prev => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y + step };
        case 'down': return { ...prev, y: prev.y - step };
        case 'left': return { ...prev, x: prev.x + step };
        case 'right': return { ...prev, x: prev.x - step };
        default: return prev;
      }
    });
  };

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
    setClinicalCauses([]);
    setResult(null);
    setActiveTab('report');
    try {
      const response = await analyzeHistologyImage(base64, mimeType);
      setResult(response.report);
      setAnnotations(response.annotations);
      setClinicalCauses(response.clinicalCauses);
      const newResult: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        image: base64,
        text: response.report,
        annotations: response.annotations,
        clinicalCauses: response.clinicalCauses,
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
    setClinicalCauses([]);
    setSelectedAnnotationIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError(null);
    setReportText('');
    setReportFileBase64(null);
    setReportFileType(null);
    setReportFileName(null);
    setInterpretationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (reportFileInputRef.current) reportFileInputRef.current.value = '';
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setImage(item.image);
    setResult(item.text);
    setAnnotations(item.annotations);
    setClinicalCauses(item.clinicalCauses || []);
    setActiveTab('report');
    setError(null);
  };

  const startQuiz = async () => {
    if (!image || !result) return;
    setIsGeneratingQuiz(true);
    setActiveTab('quiz');
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setUserAnswers([]);
    setQuizFeedback(null);
    
    try {
      const quizResponse = await generateHistologyQuiz(image, 'image/jpeg', { report: result, annotations, clinicalCauses });
      setQuizQuestions(quizResponse.questions);
    } catch (err: any) {
      setError(err.message || 'Hiba történt a kvíz generálása során.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (quizFinished || quizFeedback) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) setQuizScore(prev => prev + 1);
    
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
    setQuizFeedback(isCorrect ? 'Helyes válasz!' : 'Helytelen válasz.');
    
    if (currentQuestion.annotationRef !== undefined && annotations[currentQuestion.annotationRef]) {
      focusAnnotation(annotations[currentQuestion.annotationRef], currentQuestion.annotationRef);
    }
  };

  const nextQuestion = () => {
    setQuizFeedback(null);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={cn(
      "min-h-screen bg-bg text-ink overflow-x-hidden selection:bg-primary/10 selection:text-primary flex flex-col transition-colors duration-500",
      theme === 'dark' && "dark"
    )}>
      {!hasAcceptedTerms && view !== 'terms' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg/90 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl bg-surface border border-line shadow-2xl rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
            
            <div className="flex justify-center mb-8">
               <ScientificLogo size={80} className="text-primary" />
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-center text-primary mb-6">
              Üdvözli a MetszetMester!
            </h2>
            
            <p className="text-primary/70 mb-8 leading-relaxed text-center">
              A MetszetMester egy mesterséges intelligencián alapuló szövettani oktatóprogram, amely kizárólag oktatási és szemléltetési célokat szolgál. A rendszer nem minősül orvostechnikai eszköznek, nem alkalmas diagnózis felállítására, és nem helyettesíti a szakképzett patológus vagy más egészségügyi szakember szakvéleményét.
            </p>
            
            <label className="flex items-start gap-4 p-5 rounded-2xl border border-line bg-surface/50 cursor-pointer hover:bg-surface transition-colors mb-8 group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  checked={termsCheckboxChecked}
                  onChange={(e) => setTermsCheckboxChecked(e.target.checked)}
                  className="w-5 h-5 appearance-none rounded border-2 border-primary/30 checked:bg-primary checked:border-primary transition-all peer"
                />
                <svg viewBox="0 0 14 14" fill="none" className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                  <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-sm text-primary/80 leading-relaxed font-medium">
                Elolvastam és elfogadom a <button onClick={(e) => { e.preventDefault(); setView('terms'); }} className="text-secondary font-bold hover:underline">felhasználási feltételeket és jogi nyilatkozatot</button>.
              </div>
            </label>
            
            <button 
              onClick={handleAcceptTerms}
              disabled={!termsCheckboxChecked}
              className={cn(
                "w-full py-4 rounded-xl font-mono uppercase tracking-widest text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                termsCheckboxChecked 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5" 
                  : "bg-line/50 text-primary/40 cursor-not-allowed"
              )}
            >
              Elfogadom és Tovább
            </button>
          </motion.div>
        </div>
      )}

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-surface/80 backdrop-blur-md border border-line rounded-full text-primary shadow-lg hover:shadow-primary/5 hover:scale-105 active:scale-95 transition-all group overflow-hidden"
          title={theme === 'light' ? t.theme.switchToDark : t.theme.switchToLight}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {theme === 'light' ? <Moon size={14} strokeWidth={2.5} /> : <Sun size={14} strokeWidth={2.5} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold opacity-70 group-hover:opacity-100 transition-opacity">
            {theme === 'light' ? t.theme.dark : t.theme.light}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12 md:py-20 relative flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">
          {view === 'report_interpreter' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <div 
                  onClick={() => setView('main')}
                  className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="relative overflow-hidden p-1 text-primary">
                    <ScientificLogo size={32} />
                  </div>
                  <span className="font-serif font-bold text-primary pr-2">MetszetMester</span>
                </div>
                <div className="flex items-center gap-4">
                  {interpretationResult && (
                    <button 
                      onClick={exportInterpretationToPDF}
                      disabled={isExporting}
                      className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-secondary text-white text-[10px] font-mono uppercase tracking-widest hover:bg-secondary/90 transition-all duration-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      {isExporting ? 'Exportálás...' : 'PDF Export'}
                    </button>
                  )}
                  <button 
                    onClick={() => reportFileInputRef.current?.click()}
                    disabled={isInterpreting}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-line text-[10px] font-mono uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={12} />
                    Új feltöltés
                  </button>
                  <input 
                    type="file" 
                    ref={reportFileInputRef}
                    onChange={handleReportFileUpload}
                    accept="image/*,.jpg,.jpeg,.png,application/pdf,text/plain"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="bg-surface border border-line rounded-[3rem] p-12 md:p-20 shadow-sm space-y-12">
                <div className="space-y-6 max-w-3xl">
                  <div className="flex items-center gap-4 text-secondary">
                    <div className="p-3 bg-secondary/10 rounded-2xl">
                      <FileText size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">{t.interpreter.title}</h2>
                  </div>
                  <div className="h-1 w-24 bg-secondary rounded-full" />
                  <p className="text-xl md:text-2xl font-serif text-primary/80 leading-relaxed italic">
                    {t.interpreter.subtitle}
                  </p>
                </div>
                
                <div className="space-y-6">
                  {reportFileBase64 && reportFileType?.startsWith('image/') && (
                    <div className="relative w-full h-64 rounded-3xl overflow-hidden border border-line bg-surface flex items-center justify-center">
                      <img src={reportFileBase64} alt="Feltöltött lelet" className="max-w-full max-h-full object-contain" />
                      <button 
                        onClick={() => {
                          setReportFileBase64(null);
                          setReportFileType(null);
                          setReportFileName(null);
                          setReportText('');
                        }}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {reportFileBase64 && reportFileType === 'application/pdf' && (
                    <div className="relative w-full p-6 rounded-3xl border border-line bg-surface flex items-center gap-4">
                      <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                        <FileText size={32} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-primary">{reportFileName}</h4>
                        <p className="text-sm text-primary/60">{t.interpreter.pdfDoc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setReportFileBase64(null);
                          setReportFileType(null);
                          setReportFileName(null);
                          setReportText('');
                        }}
                        className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!reportFileBase64 && (
                    <textarea
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder={t.interpreter.placeholder}
                      className="w-full h-48 p-6 bg-primary/5 border border-primary/10 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-secondary/50 text-primary placeholder:text-primary/30"
                    />
                  )}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                      onClick={handleInterpretReport}
                      disabled={isInterpreting || (!reportText.trim() && !reportFileBase64)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-white rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isInterpreting ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                      {isInterpreting ? t.interpreter.analyzing : t.interpreter.analyzeText}
                    </button>
                    <button
                      onClick={() => reportFileInputRef.current?.click()}
                      disabled={isInterpreting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-surface border-2 border-dashed border-primary/20 text-primary rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-primary/5 hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload size={16} />
                      {t.interpreter.uploadDoc}
                    </button>
                  </div>
                </div>

                {interpretationResult && (
                  <motion.div
                    id="interpretation-content-to-pdf"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 pt-8 border-t border-line bg-surface p-4 rounded-xl"
                  >
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-700 dark:text-red-400">
                      <AlertTriangle size={24} className="shrink-0 mt-1" />
                      <p className="text-sm font-medium leading-relaxed">{interpretationResult.disclaimer}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-serif font-bold text-primary">Általános összefoglaló</h3>
                      <p className="text-primary/80 leading-relaxed">{interpretationResult.summary}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-serif font-bold text-primary">Orvosi terminológia magyarázata</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {interpretationResult.terms.map((term, idx) => (
                          <div key={idx} className="p-6 bg-surface border border-line rounded-2xl space-y-2">
                            <h4 className="font-bold text-secondary">{term.term}</h4>
                            <p className="text-sm text-primary/70 leading-relaxed">{term.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : view === 'clinical' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <div 
                  onClick={() => setView('main')}
                  className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="relative overflow-hidden p-1 text-primary">
                    <ScientificLogo size={32} />
                  </div>
                  <span className="font-serif font-bold text-primary pr-2">MetszetMester</span>
                </div>
              </div>

              <div className="bg-surface border border-line rounded-[3rem] p-12 md:p-20 shadow-sm space-y-12">
                <div className="space-y-6 max-w-3xl">
                  <div className="flex items-center gap-4 text-secondary">
                    <div className="p-3 bg-secondary/10 rounded-2xl">
                      <FileText size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Klinikai Gondolkodás</h2>
                  </div>
                  <div className="h-1 w-24 bg-secondary rounded-full" />
                  <p className="text-xl md:text-2xl font-serif text-primary/80 leading-relaxed italic">
                    "Ez a modul a tünetek mögötti lehetséges okok és patofiziológiai összefüggések megértését segíti, oktatási céllal."
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {clinicalCauses.length > 0 ? (
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 px-6 py-3 bg-secondary/10 rounded-2xl w-fit">
                        <Brain size={20} className="text-secondary" />
                        <span className="text-sm font-mono uppercase tracking-widest font-bold text-secondary">Differenciáldiagnosztikai javaslatok</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {clinicalCauses.map((cause, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 bg-surface border border-line rounded-[2.5rem] hover:border-secondary/30 transition-all group"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors">{cause.nev}</h3>
                                <span className="text-[10px] font-mono bg-primary/5 px-2 py-1 rounded text-primary/40">#{idx + 1}</span>
                              </div>
                              <p className="text-sm text-primary/80 font-medium leading-relaxed italic border-l-2 border-secondary/30 pl-4">
                                {cause.rovid_magyarazat}
                              </p>
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Patofiziológia</h4>
                                <p className="text-sm text-primary/60 leading-relaxed">
                                  {cause.patofiziologia}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Differenciálás</h4>
                                <p className="text-sm text-primary/60 leading-relaxed">
                                  {cause.kulonbseg}
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-line/50">
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-secondary/60">Gondolkodási lépés</h4>
                                <p className="text-sm text-primary/70 leading-relaxed italic">
                                  {cause.gondolkodasi_lepes}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4">
                        <h4 className="text-sm font-mono uppercase tracking-widest font-bold text-primary">A modul célja</h4>
                        <p className="text-sm text-primary/70 leading-relaxed">
                          A szövettani elváltozások és a klinikai tünetek közötti híd megteremtése. Segítünk értelmezni, hogy a mikroszkóp alatt látott képletek hogyan nyilvánulnak meg a beteg állapotában.
                        </p>
                      </div>
                      <div className="p-8 bg-secondary/5 rounded-[2.5rem] border border-secondary/10 space-y-4">
                        <h4 className="text-sm font-mono uppercase tracking-widest font-bold text-secondary">Hogyan használja?</h4>
                        <p className="text-sm text-primary/70 leading-relaxed">
                          Töltsön fel egy szövettani metszetet a főoldalon, végezze el az elemzést, majd térjen vissza ide a klinikai összefüggések megtekintéséhez.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'terms' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="bg-surface/50 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 border border-line/20 shadow-2xl">
                <button 
                  onClick={() => setView('main')}
                  className="mb-8 flex items-center gap-2 text-primary hover:text-secondary transition-colors text-sm font-mono uppercase tracking-widest font-bold"
                >
                  <ChevronLeft size={16} />
                  Vissza a főoldalra
                </button>
                <h1 className="font-serif text-4xl md:text-5xl font-medium text-primary mb-12">
                  Felhasználási feltételek és Jogi nyilatkozat
                </h1>
                
                <div className="space-y-8 text-primary/80 leading-relaxed font-serif text-lg">
                  <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">1. Oktatási Célú Felhasználás</h2>
                    <p>
                      A MetszetMester ("Alkalmazás") egy mesterséges intelligencia (AI) alapú, szövettani oktatást segítő demonstrációs eszköz. 
                      Az Alkalmazás által generált tartalmak, elemzések és vizuális jelölések <strong>kizárólag oktatási és tájékoztatási célokat szolgálnak</strong>.
                    </p>
                  </section>
                  
                  <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">2. Klinikai és Diagnosztikai Felhasználás Kizárása</h2>
                    <p>
                      Az Alkalmazás <strong>NEM minősül orvostechnikai eszköznek</strong>, és semmilyen körülmények között sem használható orvosi diagnózis felállítására, 
                      kezelési terv készítésére vagy bármely orvosi/klinikai döntéshozatalhoz. Az AI modell által adott információk pontatlanok vagy hibásak lehetnek. 
                      Minden orvosi kérdéssel vagy a szövettani leletek végleges kiértékelésével forduljon szakképzett szakorvoshoz (patológushoz).
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">3. Szerzői jogok és Szellemi tulajdon</h2>
                    <p className="mb-4">
                      Az egészségügyi szövettani oktatóprogram koncepciója, felépítése és tartalma a szerző kizárólagos szellemi tulajdona.
                    </p>
                    <p className="mb-4">
                      A szövettani minták elemzését a felhasználók végzik, azonban ez nem biztosít számukra semmilyen tulajdonjogot vagy felhasználási jogot a program egészére, illetve annak bármely elemére vonatkozóan.
                    </p>
                    <p className="mb-4">
                      A program bármely részének másolása, terjesztése vagy módosítása kizárólag a szerző előzetes, írásbeli engedélyével lehetséges.
                    </p>
                    <p>
                      Az oktatóprogram oktatási célokat szolgál, nem minősül orvosi diagnosztikai eszköznek.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">4. Adatkezelés és Titkosítás</h2>
                    <p>
                      Kérjük, <strong>ne töltsön fel személyes egészségügyi adatokat (PHI), betegneveket vagy egyedi azonosítókat</strong> tartalmazó képeket vagy leleteket az 
                      Alkalmazásba. A feltöltött adatokat nem tároljuk szervereinken, azok elemzés után nem kerülnek megőrzésre, de a harmadik fél (Google AI) API 
                      szerverein átmenetileg feldolgozásra kerülnek.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">5. Felelősségkizárás</h2>
                    <p>
                      Az oldal üzemeltetője, illetve a modell fejlesztői semmilyen felelősséget nem vállalnak az Alkalmazás használatából eredő 
                      közvetlen vagy közvetett károkért, az itt található információk helyességéért, teljességéért vagy aktualitásáért. 
                      A feltöltött képek elemzését egy felhőalapú mesterséges intelligencia (Gemini) végzi, az eredményeket a felhasználó saját felelősségére értelmezi.
                    </p>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : !image ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-12 md:mb-16 flex flex-col items-center gap-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="p-8 text-primary relative overflow-hidden group cursor-pointer"
                  onClick={() => setView('main')}
                >
                  <ScientificLogo size={240} />
                </motion.div>
                <div className="space-y-3">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="elegant-title text-6xl md:text-8xl leading-normal md:leading-normal cursor-pointer"
                    onClick={() => setView('main')}
                  >
                    MetszetMester
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] opacity-80 font-mono font-bold text-primary">
                      Histology Educator
                    </p>
                    <div className="h-px w-12 bg-primary/60 my-1" />
                    <p className="text-[10px] md:text-[11px] opacity-90 font-serif italic text-primary tracking-wide font-medium drop-shadow-sm">
                      by Mékli Zsuzsanna
                    </p>
                  </motion.div>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-light mb-12 tracking-tight text-primary/80 max-w-2xl leading-relaxed">
                Fedezze fel a mikroszkópos világot egy digitális asszisztens segítségével.
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
                    <p className="text-xl md:text-2xl font-medium text-primary">{t.upload.dragAndDrop}</p>
                    <p className="text-xs md:text-sm opacity-30 font-mono tracking-widest uppercase">{t.upload.browseFile}</p>
                  </div>
                </div>
              </div>

              {/* About the Creator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-16 max-w-3xl mx-auto text-center space-y-6 relative px-6"
              >
                <div className="absolute left-1/2 -top-8 -translate-x-1/2 w-12 h-px bg-primary/20" />
                <p className="text-sm md:text-base font-serif text-primary/80 leading-relaxed">
                  Mékli Zsuzsanna vagyok, egészségügyi alapvégzettséggel és informatikai ismeretekkel.
                </p>
                <p className="text-sm md:text-base font-serif text-primary/80 leading-relaxed">
                  Az oktatóprogramot azért hoztam létre, mert a szövettani metszetek területén kevés olyan tananyag érhető el, amely segítené az összefüggések felismerését és a szemléletalapú tanulást. Mondhatnánk azt is, hogy képes szövettani gyakorlat.
                </p>
                <p className="text-sm md:text-base font-serif text-primary/80 leading-relaxed italic">
                  A célom nem a diagnosztizálás, hanem a szövettani struktúrák készségszintű felismerésének fejlesztése.
                </p>
              </motion.div>

              {/* Feature Navigation Buttons */}
              <div className="mt-16 md:mt-24 flex flex-col sm:flex-row gap-6 md:gap-8 justify-center pb-12 w-full">
                <motion.button 
                  onClick={() => setView('clinical')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-4 md:gap-5 px-6 md:px-8 py-5 md:py-6 bg-gradient-to-br from-surface to-off-white overflow-hidden rounded-3xl border border-secondary/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-500 w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  <div className="p-3 bg-secondary/10 rounded-2xl text-secondary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm">
                    <Brain size={22} className="relative z-10" />
                  </div>
                  <div className="text-left">
                    <span className="block font-serif text-lg md:text-xl font-bold text-primary relative z-10">{t.nav.clinicalReasoning}</span>
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-primary/50 mt-1">Esettanulmányok</span>
                  </div>
                </motion.button>

                <motion.button 
                  onClick={() => setView('report_interpreter')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-4 md:gap-5 px-6 md:px-8 py-5 md:py-6 bg-gradient-to-br from-surface to-off-white overflow-hidden rounded-3xl border border-secondary/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-500 w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  <div className="p-3 bg-secondary/10 rounded-2xl text-secondary group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm">
                    <FileText size={22} className="relative z-10" />
                  </div>
                  <div className="text-left">
                    <span className="block font-serif text-lg md:text-xl font-bold text-primary relative z-10">{t.nav.reportInterpreter}</span>
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-secondary mt-1">Oktatási Mód</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-12 md:space-y-16">
              {/* Minimal Header when image is present */}
              <header className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setView('main')}>
                  <div className="relative overflow-hidden p-1 text-primary">
                    <ScientificLogo size={32} />
                  </div>
                  <span className="font-serif font-bold text-primary pr-2">MetszetMester</span>
                </div>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
                  <div className="hidden md:flex items-center gap-3">
                    <button 
                      onClick={() => setView('clinical')} 
                      className="px-4 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-primary text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-secondary/10 hover:border-secondary/40 transition-all duration-300 flex items-center gap-2"
                    >
                      <Brain size={12} className="text-secondary" />
                      Klinikai Gondolkodás
                    </button>
                    <button 
                      onClick={() => setView('report_interpreter')} 
                      className="px-4 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-primary text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-secondary/10 hover:border-secondary/40 transition-all duration-300 flex items-center gap-2"
                    >
                      <FileText size={12} className="text-secondary" />
                      Leletértelmező
                    </button>
                  </div>
                  {result && (
                    <button 
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-secondary text-white text-[10px] font-mono uppercase tracking-widest hover:bg-secondary/90 transition-all duration-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      {isExporting ? 'Exportálás...' : 'PDF Export'}
                    </button>
                  )}
                  <button 
                    onClick={clearCurrent}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-line text-[10px] font-mono uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-sm"
                  >
                    <Upload size={12} />
                    Új feltöltés
                  </button>
                </div>
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
                    {/* Floating Toggle Button (Top Right) */}
                    <button
                      onClick={() => setIsFloating(!isFloating)}
                      className={cn(
                        "absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-md backdrop-blur-md border",
                        isFloating 
                          ? "bg-secondary text-white border-secondary/50 shadow-secondary/20 hover:bg-secondary/90" 
                          : "bg-surface/80 text-primary border-line shadow-primary/5 hover:bg-surface hover:scale-105"
                      )}
                    >
                      {isFloating ? <Anchor size={14} className="opacity-80" /> : <Move size={14} className="opacity-80" />}
                      <span>{isFloating ? "Dokkolás" : "Lebegő Nézet"}</span>
                    </button>

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
                                scale: hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? 1.02 : 1
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
                              {/* Pulsating backdrop for highlighted state */}
                              {(hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx) && (
                                <motion.rect
                                  x={ann.xmin}
                                  y={ann.ymin}
                                  width={ann.xmax - ann.xmin}
                                  height={ann.ymax - ann.ymin}
                                  fill="transparent"
                                  stroke="currentColor"
                                  className="text-secondary"
                                  rx={4 / zoom}
                                  initial={{ opacity: 0, strokeWidth: 4 / zoom }}
                                  animate={{
                                    opacity: [0.4, 0.1, 0.4],
                                    strokeWidth: [4 / zoom, 12 / zoom, 4 / zoom]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              )}
                              
                              <motion.rect
                                x={ann.xmin}
                                y={ann.ymin}
                                width={ann.xmax - ann.xmin}
                                height={ann.ymax - ann.ymin}
                                rx={4 / zoom}
                                fill={hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? "rgba(59, 110, 165, 0.15)" : "transparent"}
                                stroke="currentColor"
                                strokeWidth={hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? 3 / zoom : 1.5 / zoom}
                                className={cn(
                                  "transition-all duration-300",
                                  hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? "text-secondary" : "text-primary/40"
                                )}
                                animate={hoveredAnnotationIndex === idx || selectedAnnotationIndex === idx ? {
                                  filter: [
                                    "drop-shadow(0 0 2px rgba(59, 110, 165, 0.4))",
                                    "drop-shadow(0 0 8px rgba(59, 110, 165, 0.8))",
                                    "drop-shadow(0 0 2px rgba(59, 110, 165, 0.4))"
                                  ]
                                } : {
                                  filter: "drop-shadow(0 0 0px rgba(59, 110, 165, 0))"
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            </motion.g>
                          ))}
                        </AnimatePresence>
                      </svg>

                      {/* Floating Detailed Tooltip */}
                      <AnimatePresence>
                        {hoveredAnnotationIndex !== null && annotations[hoveredAnnotationIndex] && (() => {
                          const ann = annotations[hoveredAnnotationIndex];
                          const xCenter = (ann.xmin + ann.xmax) / 20;
                          const yTop = ann.ymin / 10;
                          const yBottom = ann.ymax / 10;
                          
                          const isNearTop = yTop < 25;
                          const isNearLeft = xCenter < 25;
                          const isNearRight = xCenter > 75;
                          
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: isNearTop ? -10 : 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: isNearTop ? -10 : 10 }}
                              className="absolute z-50 pointer-events-none flex flex-col"
                              style={{
                                left: isNearLeft ? `${ann.xmin / 10}%` : isNearRight ? `${ann.xmax / 10}%` : `${xCenter}%`,
                                top: isNearTop ? `${yBottom}%` : `${yTop}%`,
                                transform: `translate(${isNearLeft ? '0' : isNearRight ? '-100%' : '-50%'}, ${isNearTop ? '10px' : 'calc(-100% - 10px)'})`,
                                scale: 1 / zoom // Keep tooltip size consistent regardless of zoom
                              }}
                            >
                              {/* If near top, arrow should be on top pointing UP */}
                              {isNearTop && (
                                <div 
                                  className="w-4 h-4 bg-surface border-l border-t border-primary/20 rotate-45 mb-[-8px] shadow-sm z-10" 
                                  style={{ 
                                     alignSelf: isNearLeft ? 'flex-start' : isNearRight ? 'flex-end' : 'center',
                                     marginLeft: isNearLeft ? '24px' : '0',
                                     marginRight: isNearRight ? '24px' : '0'
                                  }} 
                                />
                              )}
                              
                              <div className="bg-surface/95 backdrop-blur-md border border-primary/20 p-5 rounded-[2rem] shadow-2xl w-64 md:w-80 relative z-20">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                    <h4 className="text-sm font-serif font-bold text-primary">
                                      {ann.label}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-secondary">#{hoveredAnnotationIndex + 1}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-primary/70 font-medium">
                                  {ann.description}
                                </p>
                                <div className="mt-4 pt-3 border-t border-line/30 flex items-center gap-2">
                                  <Info size={12} className="text-secondary" />
                                  <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Szövettani Morfológia</span>
                                </div>
                              </div>

                              {/* If not near top, arrow should be on bottom pointing DOWN */}
                              {!isNearTop && (
                                <div 
                                  className="w-4 h-4 bg-surface border-r border-b border-primary/20 rotate-45 mt-[-8px] shadow-sm z-10" 
                                  style={{ 
                                     alignSelf: isNearLeft ? 'flex-start' : isNearRight ? 'flex-end' : 'center',
                                     marginLeft: isNearLeft ? '24px' : '0',
                                     marginRight: isNearRight ? '24px' : '0'
                                  }}
                                />
                              )}
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </motion.div>
                    
                    {/* Zoom & Pan Controls Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {/* Pan Controls (D-Pad) */}
                      <div className="flex flex-col items-center bg-surface/90 backdrop-blur-md p-2 rounded-full border border-line shadow-lg scale-90">
                        <button 
                          onClick={() => handlePan('up')}
                          className="p-1.5 hover:bg-primary/5 rounded-full text-primary transition-colors"
                          title="Felfelé mozgatás"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handlePan('left')}
                            className="p-1.5 hover:bg-primary/5 rounded-full text-primary transition-colors"
                            title="Balra mozgatás"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <div className="w-1 h-1 rounded-full bg-primary/20" />
                          <button 
                            onClick={() => handlePan('right')}
                            className="p-1.5 hover:bg-primary/5 rounded-full text-primary transition-colors"
                            title="Jobbra mozgatás"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handlePan('down')}
                          className="p-1.5 hover:bg-primary/5 rounded-full text-primary transition-colors"
                          title="Lefelé mozgatás"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Zoom Controls Bar */}
                      <div className="flex items-center gap-2 p-2 bg-surface/90 backdrop-blur-md rounded-full border border-line shadow-lg">
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
                            className="absolute left-0 right-0 h-[2px] z-20 blur-[0.5px]"
                            style={{
                              background: 'linear-gradient(90deg, rgba(59,110,165,0) 0%, rgba(59,110,165,0.8) 20%, rgba(99,102,241,0.8) 40%, rgba(168,85,247,0.8) 60%, rgba(236,72,153,0.8) 80%, rgba(59,110,165,0) 100%)',
                              backgroundSize: '200% 100%',
                              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                            }}
                            animate={{ 
                              top: ["0%", "100%", "0%"],
                              backgroundPosition: ["0% 0%", "200% 0%"]
                            }}
                            transition={{ 
                              top: {
                                duration: 10, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              },
                              backgroundPosition: {
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear"
                              }
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
                          <div className="p-4 text-primary relative overflow-hidden">
                            <ScientificLogo size={80} />
                          </div>
                        </motion.div>
                      </div>
                      
                      <div className="space-y-4 z-10">
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-2xl md:text-3xl font-serif italic text-primary"
                        >
                          {t.upload.analyzing}
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
                      <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8",
                        isFloating ? "lg:grid-cols-4" : ""
                      )}>
                        <button
                          onClick={() => setActiveTab('report')}
                          className={cn(
                            "flex-1 py-4 px-6 rounded-3xl border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'report' 
                              ? "bg-primary border-primary text-white shadow-xl scale-[1.01]" 
                              : "bg-surface border-line text-primary/40 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl transition-colors">
                              <FileText size={24} />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">Dokumentáció</span>
                              <h4 className="text-base font-serif font-bold">Elemzési Jelentés</h4>
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
                            "flex-1 py-4 px-6 rounded-3xl border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'structures' 
                              ? "bg-primary border-primary text-white shadow-xl scale-[1.01]" 
                              : "bg-surface border-line text-primary/40 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl transition-colors">
                              <ScientificLogo 
                                size={24} 
                                className={cn(activeTab === 'structures' ? "" : "[&_img]:opacity-40")} 
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">Morfológia</span>
                              <h4 className="text-base font-serif font-bold">{t.tabs.structures}</h4>
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

                        <button
                          onClick={startQuiz}
                          className={cn(
                            "flex-1 py-4 px-6 rounded-3xl border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'quiz' 
                              ? "bg-secondary border-secondary text-white shadow-xl scale-[1.01]" 
                              : "bg-surface border-line text-primary/40 hover:border-secondary/20 hover:text-secondary"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl transition-colors">
                              <Brain size={24} />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">Oktatás</span>
                              <h4 className="text-base font-serif font-bold">{t.tabs.quiz}</h4>
                            </div>
                          </div>
                          {activeTab === 'quiz' && (
                            <motion.div 
                              layoutId="tab-glow"
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab('clinical')}
                          className={cn(
                            "flex-1 py-4 px-6 rounded-3xl border-2 transition-all duration-500 text-left group relative overflow-hidden",
                            activeTab === 'clinical' 
                              ? "bg-primary border-primary text-white shadow-xl scale-[1.01]" 
                              : "bg-surface border-line text-primary/40 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl transition-colors">
                              <FileText size={24} />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">Összefüggések</span>
                              <h4 className="text-base font-serif font-bold">{t.tabs.clinical}</h4>
                            </div>
                          </div>
                          {activeTab === 'clinical' && (
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
                            <div className="mb-4 md:mb-8 border-b border-line pb-4">
                              <h3 className="font-serif text-xl font-bold text-primary">{t.tabs.report}</h3>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">{t.tabs.reportSub}</p>
                            </div>
                            <div id="report-content-to-pdf" className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-secondary prose-a:no-underline hover:prose-a:underline bg-surface p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-line shadow-sm overflow-hidden prose-p:text-primary/80 prose-p:leading-relaxed prose-li:text-primary/80 prose-strong:text-primary focus:outline-none">
                              <Markdown
                                components={{
                                  a: ({ node, ...props }) => {
                                    if (props.href?.startsWith('annotation:')) {
                                      const index = parseInt(props.href.split(':')[1]);
                                      return (
                                        <button
                                          onClick={() => focusAnnotation(annotations[index], index)}
                                          className="text-secondary font-bold cursor-pointer inline-flex items-center bg-secondary/10 px-1.5 rounded-md hover:bg-secondary/20 transition-colors mx-0.5 border border-secondary/20 shadow-sm"
                                        >
                                          {props.children}
                                        </button>
                                      );
                                    }
                                    return <a {...props} />;
                                  }
                                }}
                              >
                                {processedResult}
                              </Markdown>
                            </div>
                          </motion.div>
                        ) : activeTab === 'structures' ? (
                          <motion.div 
                            key="structures-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-12"
                          >
                            <div className="mb-4 md:mb-8 border-b border-line pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                              <div>
                                <h3 className="font-serif text-xl font-bold text-primary">{t.tabs.structures}</h3>
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">{t.tabs.structuresSub}</p>
                              </div>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
                                <input 
                                  type="text" 
                                  placeholder={t.tabs.searchStructures}
                                  value={structureSearch}
                                  onChange={(e) => setStructureSearch(e.target.value)}
                                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full border border-line bg-surface text-sm focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 placeholder:text-primary/30 transition-all text-primary"
                                />
                              </div>
                            </div>

                            <div className="w-full">
                              {/* List of Descriptions */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {annotations.filter(ann => ann.label.toLowerCase().includes(structureSearch.toLowerCase()) || ann.description.toLowerCase().includes(structureSearch.toLowerCase())).map((ann) => {
                                  // Find the original index for focusAnnotation to work correctly
                                  const originalIndex = annotations.findIndex(a => a === ann);
                                  return (
                                    <motion.div
                                      key={originalIndex}
                                      onMouseEnter={() => setHoveredAnnotationIndex(originalIndex)}
                                      onMouseLeave={() => setHoveredAnnotationIndex(null)}
                                      onClick={() => focusAnnotation(ann, originalIndex)}
                                      className={cn(
                                        "p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                                        selectedAnnotationIndex === originalIndex 
                                          ? "bg-secondary/5 border-secondary/30 shadow-md translate-y-[-4px]" 
                                          : "bg-surface border-line hover:border-primary/20"
                                      )}
                                    >
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                          <span className={cn(
                                            "text-xl font-serif font-bold transition-colors",
                                            selectedAnnotationIndex === originalIndex ? "text-secondary" : "text-primary"
                                          )}>
                                            {ann.label}
                                          </span>
                                          {selectedAnnotationIndex === originalIndex && (
                                            <div className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-mono uppercase tracking-widest rounded-full">
                                              Fókuszban
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-sm text-primary/60 leading-relaxed group-hover:text-primary/80 transition-colors">
                                          {ann.description}
                                        </p>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                                {annotations.filter(ann => ann.label.toLowerCase().includes(structureSearch.toLowerCase()) || ann.description.toLowerCase().includes(structureSearch.toLowerCase())).length === 0 && (
                                  <div className="col-span-1 md:col-span-2 py-12 text-center text-primary/40 font-serif italic">
                                    {t.tabs.noResults}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ) : activeTab === 'quiz' ? (
                          <motion.div
                            key="quiz-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                          >
                            <div className="mb-8 border-b border-line pb-4">
                              <h3 className="font-serif text-xl font-bold text-primary">Szövettan Kvíz</h3>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Histology Knowledge Test</p>
                            </div>

                            {isGeneratingQuiz ? (
                              <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                                <Loader2 className="animate-spin text-secondary" size={48} />
                                <p className="text-xl font-serif italic text-primary">{t.quiz.generating}</p>
                              </div>
                            ) : quizFinished ? (
                              <div className="p-8 md:p-12 bg-surface border border-line rounded-[3rem] text-center space-y-8 shadow-sm">
                                <div className="inline-flex p-6 bg-secondary/10 rounded-full text-secondary mb-4">
                                  <Trophy size={48} />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-3xl font-serif font-bold text-primary">{t.quiz.finished}</h3>
                                  <p className="text-lg text-primary/60">{t.quiz.congrats}</p>
                                </div>
                                <div className="text-6xl font-serif font-bold text-secondary">
                                  {quizScore} / {quizQuestions.length}
                                </div>
                                <p className="text-sm text-primary/40 max-w-md mx-auto">
                                  {quizScore === quizQuestions.length 
                                    ? t.quiz.perfect 
                                    : quizScore >= quizQuestions.length / 2 
                                      ? t.quiz.good 
                                      : t.quiz.needsWork}
                                </p>
                                <button 
                                  onClick={startQuiz}
                                  className="px-8 py-4 bg-primary text-white rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                                >
                                  {t.quiz.generate}
                                </button>
                              </div>
                            ) : quizQuestions.length > 0 ? (
                              <div className="space-y-8">
                                <div className="flex items-center justify-between px-4">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary/40">
                                    Kérdés {currentQuestionIndex + 1} / {quizQuestions.length}
                                  </span>
                                  <div className="h-1.5 w-32 bg-line rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-secondary"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="p-8 md:p-10 bg-surface border border-line rounded-[3rem] shadow-sm space-y-8">
                                  <h3 className="text-xl md:text-2xl font-serif font-bold text-primary leading-relaxed">
                                    {quizQuestions[currentQuestionIndex].question}
                                  </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                      {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                                        const isSelected = userAnswers[currentQuestionIndex] === idx;
                                        const isCorrect = idx === quizQuestions[currentQuestionIndex].correctAnswerIndex;
                                        const showResult = quizFeedback !== null;

                                        return (
                                          <motion.button
                                            key={`${currentQuestionIndex}-${idx}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            disabled={showResult}
                                            onClick={() => handleAnswer(idx)}
                                            className={cn(
                                              "p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between group",
                                              showResult 
                                                ? isCorrect 
                                                  ? "bg-green-50 border-green-500 text-green-700"
                                                  : isSelected 
                                                    ? "bg-red-50 border-red-500 text-red-700"
                                                    : "bg-surface border-line opacity-40"
                                                : "bg-surface border-line hover:border-primary/30 hover:bg-primary/5 text-primary"
                                            )}
                                          >
                                            <span className="font-medium">{option}</span>
                                            <AnimatePresence>
                                              {showResult && isCorrect && (
                                                <motion.div
                                                  initial={{ scale: 0, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                >
                                                  <CheckCircle2 size={20} className="text-green-500" />
                                                </motion.div>
                                              )}
                                              {showResult && isSelected && !isCorrect && (
                                                <motion.div
                                                  initial={{ scale: 0, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                >
                                                  <XCircle size={20} className="text-red-500" />
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </motion.button>
                                        );
                                      })}
                                    </div>

                                  <AnimatePresence>
                                    {quizFeedback && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-6 border-t border-line space-y-6"
                                      >
                                        <div className="space-y-4">
                                          <motion.div 
                                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className={cn(
                                              "flex items-center gap-3 p-4 rounded-2xl border",
                                              userAnswers[currentQuestionIndex] === quizQuestions[currentQuestionIndex].correctAnswerIndex
                                                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                            )}
                                          >
                                            <motion.div
                                              initial={{ scale: 0, rotate: -45 }}
                                              animate={{ scale: 1, rotate: 0 }}
                                              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                                            >
                                              {userAnswers[currentQuestionIndex] === quizQuestions[currentQuestionIndex].correctAnswerIndex ? (
                                                <CheckCircle2 size={24} />
                                              ) : (
                                                <XCircle size={24} />
                                              )}
                                            </motion.div>
                                            <span className="font-serif text-lg font-bold">
                                              {userAnswers[currentQuestionIndex] === quizQuestions[currentQuestionIndex].correctAnswerIndex 
                                                ? t.quiz.correct 
                                                : t.quiz.incorrect}
                                            </span>
                                          </motion.div>

                                          <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/5"
                                          >
                                            <div className="p-2 bg-surface rounded-lg shadow-sm h-fit">
                                              <Info size={20} className="text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                              <p className="text-sm font-bold text-primary">Szakmai Magyarázat</p>
                                              <p className="text-sm text-primary/70 leading-relaxed">
                                                {quizQuestions[currentQuestionIndex].explanation}
                                              </p>
                                            </div>
                                          </motion.div>
                                        </div>

                                        <div className="flex justify-end">
                                          <button
                                            onClick={nextQuestion}
                                            className="flex items-center gap-2 px-8 py-4 bg-secondary text-white rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/20"
                                          >
                                            {currentQuestionIndex < quizQuestions.length - 1 ? t.quiz.nextQuestion : t.quiz.finishQuiz}
                                            <ChevronRight size={16} />
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                                <Brain className="text-primary/10" size={64} />
                                <p className="text-lg font-serif italic text-primary/40">Kattintson az "Új kvíz indítása" gombra a kezdéshez.</p>
                                <button 
                                  onClick={startQuiz}
                                  className="px-8 py-4 bg-primary text-white rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-primary/90 transition-all"
                                >
                                  {t.quiz.generate}
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div
                            key="clinical-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                          >
                            <div className="mb-8 border-b border-line pb-4">
                              <h3 className="font-serif text-xl font-bold text-primary">{t.nav.clinicalReasoning}</h3>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Clinical Reasoning & Differential Diagnosis</p>
                            </div>

                            {clinicalCauses.length > 0 ? (
                              <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-6">
                                  {clinicalCauses.map((cause, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="p-8 bg-surface border border-line rounded-[2.5rem] hover:border-secondary/30 transition-all group"
                                    >
                                      <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                          <h3 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors">{cause.nev}</h3>
                                          <span className="text-[10px] font-mono bg-primary/5 px-2 py-1 rounded text-primary/40">#{idx + 1}</span>
                                        </div>
                                        <p className="text-sm text-primary/80 font-medium leading-relaxed italic border-l-2 border-secondary/30 pl-4">
                                          {cause.rovid_magyarazat}
                                        </p>
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Patofiziológia</h4>
                                          <p className="text-sm text-primary/60 leading-relaxed">
                                            {cause.patofiziologia}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary/40">Differenciálás</h4>
                                          <p className="text-sm text-primary/60 leading-relaxed">
                                            {cause.kulonbseg}
                                          </p>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-line/50">
                                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-secondary/60">Gondolkodási lépés</h4>
                                          <p className="text-sm text-primary/70 leading-relaxed italic">
                                            {cause.gondolkodasi_lepes}
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                                <FileText className="text-primary/10" size={64} />
                                <p className="text-lg font-serif italic text-primary/40">{t.tabs.noClinical}</p>
                              </div>
                            )}
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

      <footer className="py-12 border-t border-line/10 bg-surface/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] md:text-xs font-serif text-primary/70 tracking-widest uppercase leading-relaxed max-w-3xl mx-auto">
            © 2026 <button onClick={() => setView('main')} className="hover:text-secondary hover:underline transition-colors focus:outline-none">Metszetmester.hu</button> – Szövettani Oktató Program
            <span className="block mt-2 font-bold text-primary/80">
              Az oldal kizárólag oktatási célokat szolgál. Az itt megjelenő tartalmak és AI‑alapú elemzések nem minősülnek diagnózisnak, és nem helyettesítik a szakorvosi véleményt.
            </span>
            <span className="block mt-4">
              <button 
                onClick={() => setView('terms')} 
                className="hover:text-secondary hover:underline transition-colors focus:outline-none"
              >
                Felhasználási feltételek / Jogi nyilatkozat
              </button>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
