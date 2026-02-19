import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
import ReactMarkdown from 'react-markdown';
import { generateMedicalCopy } from './services/geminiService';
import { initGoogleAuth, saveToSheet, triggerAuth, isAuthorized } from './services/sheetService';
import { GenerationInputs, Preset, GenerationResult } from './types';
import {
  Wand2,
  Copy,
  RotateCcw,
  AlertCircle,
  CheckCheck,
  FileText,
  MessageSquare,
  BookOpen,
  ShieldAlert,
  Quote,
  ScanEye,
  FlaskConical,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  Layers,
  Shuffle,
  Dice5,
  GalleryVerticalEnd,
  ImageIcon,
  Hash,
  ChevronRight,
  ChevronDown,
  Table,
  Settings,
  Save,
  X,
  FileSearch,
  GraduationCap,
  Upload,
  Image as LucideImage
} from 'lucide-react';
import { InfoTooltip } from './components/InfoTooltip';

export default function App() {
  const [inputs, setInputs] = useState<GenerationInputs>({
    persona: '',
    format: 'LinkedIn Post',
    topic: '',
    context: '',
    audience: 'Layperson (Patient/Public)',
    includeCitations: false,
    enableDistillation: false,
    batchMode: false,
    batchCount: 3,
    carouselMode: false,
    includeHashtags: false,
    summarizerMode: false,
    examSummarizerMode: false,
    imageMode: false,
    image: '',
    angle: ''
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // UI State
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSheetConfigOpen, setIsSheetConfigOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheet Integration State
  const [sheetConfig, setSheetConfig] = useState({ clientId: '', spreadsheetId: '' });
  const [isSheetSaving, setIsSheetSaving] = useState(false);
  const [sheetSaveSuccess, setSheetSaveSuccess] = useState(false);

  // Common Markdown components for premium styling
  const markdownComponents = {
    h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3 flex items-center gap-2" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-4 text-slate-600 dark:text-slate-300 leading-relaxed" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="space-y-2 mb-4" {...props} />,
    li: ({ node, ...props }: any) => (
      <li className="flex gap-2 items-start text-slate-600 dark:text-slate-300">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
        <span>{props.children}</span>
      </li>
    ),
    strong: ({ node, ...props }: any) => <strong className="font-bold text-cyan-700 dark:text-cyan-400" {...props} />,
    blockquote: ({ node, ...props }: any) => (
      <blockquote className="border-l-4 border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10 p-4 my-6 italic text-slate-700 dark:text-slate-300" {...props} />
    )
  };
  // State for Multi-Format tabs
  const [activeTab, setActiveTab] = useState<'linkedin' | 'instagram' | 'email' | 'twitter'>('linkedin');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`[MedCopy UI] ${msg}`);
    setDebugLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const ensureString = (val: any): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && !Array.isArray(val)) {
      addLog(`🛡️ Object detected in content! Stringifying to prevent crash...`);
      try {
        // Smarter flattening: detect title/post or title/content
        const title = val.title || val.header || val.headline || "";
        const body = val.post || val.content || val.body || val.text || "";

        if (title && body) {
          return `## ${title}\n\n${body}`;
        }

        // Fallback: join other entries nicely
        return Object.entries(val)
          .map(([k, v]) => `**${k.toUpperCase()}**: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n\n');
      } catch (e) {
        return JSON.stringify(val, null, 2);
      }
    }
    return String(val);
  };

  // Initialize Sheet Auth
  useEffect(() => {
    // Load saved sheet config from localStorage OR Environment Variables
    const savedClientId = localStorage.getItem('medcopy_google_client_id') || process.env.GOOGLE_CLIENT_ID || '';
    const savedSheetId = localStorage.getItem('medcopy_google_sheet_id') || process.env.GOOGLE_SPREADSHEET_ID || '';

    if (savedClientId && savedSheetId) {
      setSheetConfig({ clientId: savedClientId, spreadsheetId: savedSheetId });
      addLog("Google Sheet config loaded. Initializing auth...");
      // Small timeout to ensure google script loaded
      setTimeout(() => initGoogleAuth(savedClientId), 1000);
    }
  }, []);

  // Auto-Save Effect (Seamless background saving)
  useEffect(() => {
    if (generatedResult && !isSheetSaving && !sheetSaveSuccess) {
      addLog("Auto-save triggered for new result.");
      handleSaveToSheet();
    }
  }, [generatedResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked
      : (name === 'batchCount' || name === 'driftThreshold') ? parseInt(target.value, 10)
        : target.value;

    setInputs(prev => {
      let updates: any = { [name]: value };

      // Mutually Exclusive Modes Logic
      if (name === 'batchMode' && value === true) {
        updates.carouselMode = false;
        updates.summarizerMode = false;
        updates.examSummarizerMode = false;
        updates.imageMode = false;
        if (prev.format === 'Multi-Format Exploder') updates.format = 'LinkedIn Post';
      }
      if (name === 'carouselMode' && value === true) {
        updates.batchMode = false;
        updates.summarizerMode = false;
        updates.examSummarizerMode = false;
        updates.imageMode = false;
      }
      if (name === 'summarizerMode' && value === true) {
        updates.batchMode = false;
        updates.carouselMode = false; // Keep imageMode allowed? Maybe not for now to keep it simple.
        updates.imageMode = false;
      }
      if (name === 'imageMode' && value === true) {
        updates.batchMode = false;
        updates.carouselMode = false;
        updates.summarizerMode = false;
        updates.examSummarizerMode = false;
      }

      // If disabling summarizer mode, also disable exam mode
      if (name === 'summarizerMode' && value === false) {
        updates.examSummarizerMode = false;
      }
      // If disabling image mode, clear image?
      // if (name === 'imageMode' && value === false) { updates.image = ''; } // Optional, better to keep state if toggled back

      return { ...prev, ...updates };
    });

    if (name === 'persona') {
      setSelectedPresetId(null);
    }
  };

  // Handle Image Upload with Client-Side Resizing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large (Max 5MB). The system will attempt to compress it.");
        addLog("Image size > 5MB, attempting compression.");
      } else {
        setError(null);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 512; // Ultra-Fast Mode (512px) to prevent timeouts
          const MAX_HEIGHT = 512;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          addLog(`Image compressed to ${width}x${height} and loaded.`);

          setInputs(prev => ({
            ...prev,
            image: compressedBase64
          }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setInputs(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog("Image cleared.");
  };

  const handlePresetSelect = (preset: Preset) => {
    setInputs(prev => ({ ...prev, persona: preset.personaPrompt }));
    setSelectedPresetId(preset.id);
    addLog(`Preset selected: ${preset.id}`);
  };

  const handleGenerate = async () => {
    setError(null);
    setSheetSaveSuccess(false);
    addLog("Starting content generation...");

    // Validation Logic
    if (inputs.imageMode) {
      if (!inputs.image) {
        setError("Please upload an image for analysis.");
        addLog("Validation failed: No image for Vision Mode.");
        return;
      }
      if (!inputs.persona.trim()) {
        setError("Please select a Persona for the analysis.");
        addLog("Validation failed: No persona for Vision Mode.");
        return;
      }
    } else if (inputs.summarizerMode) {
      if (!inputs.context.trim()) {
        setError("Please provide Source Text to summarize.");
        addLog("Validation failed: No source text for Summarizer Mode.");
        return;
      }
      if (!inputs.persona.trim()) {
        setError("Please select a Persona for the summary.");
        addLog("Validation failed: No persona for Summarizer Mode.");
        return;
      }
    } else {
      if (!inputs.persona.trim() || !inputs.topic.trim()) {
        setError("Please provide at least a Persona and a Topic.");
        addLog("Validation failed: Missing persona or topic.");
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const result = await generateMedicalCopy(inputs);
      setGeneratedResult(result);
      setActiveTab('linkedin');
      addLog("Content generation successful!");
    } catch (err: any) {
      setError(err.message || "Failed to generate content.");
      addLog(`Content generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string = "") => {
    let textToCopy = text || generatedResult?.content || "";

    if (!textToCopy) {
      if (generatedResult?.multiFormatOutput) {
        textToCopy = generatedResult.multiFormatOutput[activeTab];
      } else if (generatedResult?.carouselOutput) {
        textToCopy = generatedResult.carouselOutput.map(s => `Slide ${s.slideNumber}: ${s.title}\n${s.content}\n[Visual: ${s.visualDescription}]`).join("\n\n---\n\n");
      }
    }

    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    addLog("Content copied to clipboard.");
  };

  const handleClear = () => {
    setInputs({
      persona: '',
      format: 'LinkedIn Post',
      topic: '',
      context: '',
      audience: 'Layperson (Patient/Public)',
      includeCitations: false,
      enableDistillation: false,
      batchMode: false,
      batchCount: 3,
      carouselMode: false,
      includeHashtags: false,
      summarizerMode: false,
      examSummarizerMode: false,
      imageMode: false,
      image: '',
      angle: ''
    });
    setGeneratedResult(null);
    setSelectedPresetId(null);
    setError(null);
    setActiveTab('linkedin');
    setIsPromptOpen(false);
    setSheetSaveSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog("All inputs and results cleared.");
  };

  const handleSheetConfigSave = () => {
    localStorage.setItem('medcopy_google_client_id', sheetConfig.clientId);
    localStorage.setItem('medcopy_google_sheet_id', sheetConfig.spreadsheetId);
    initGoogleAuth(sheetConfig.clientId);
    setIsSheetConfigOpen(false);
    addLog("Google Sheet config saved.");
  };

  const handleSaveToSheet = async () => {
    addLog("handleSaveToSheet starting...");
    setIsSheetSaving(true);
    try {
      // Seamless background save: We delegate all ID/Secrets check to the server proxy.
      // The frontend no longer blocks if local sheetConfig is empty.
      addLog("Sending request to Sheets proxy...");
      const success = await saveToSheet(sheetConfig.spreadsheetId, inputs, generatedResult as GenerationResult, activeTab);

      if (success) {
        addLog("✅ AUTO-SAVE SUCCESSFUL!");
        setSheetSaveSuccess(true);
        setTimeout(() => setSheetSaveSuccess(false), 3000);
      } else {
        addLog("❌ AUTO-SAVE FAILED (Proxy returned false)");
      }
    } catch (err: any) {
      addLog(`❌ CRITICAL SAVE ERROR: ${err.message}`);
      console.error("Auto-save failed:", err);
    } finally {
      setIsSheetSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (score >= 85) return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  const renderMultiFormatTabs = () => {
    if (!generatedResult?.multiFormatOutput) return null;

    const tabs = [
      { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={14} /> },
      { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
      { id: 'twitter', label: 'Twitter/X', icon: <Twitter size={14} /> },
      { id: 'email', label: 'Email', icon: <Mail size={14} /> },
    ] as const;

    const currentContent = ensureString(generatedResult.multiFormatOutput[activeTab as keyof typeof generatedResult.multiFormatOutput]);

    return (
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-8 prose prose-indigo dark:prose-invert max-w-none">
          <ReactMarkdown components={markdownComponents}>
            {currentContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER (PREMIUM GLASSMORPHISM UI)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-[#0B1120] flex flex-col font-sans text-slate-900 dark:text-slate-50 transition-colors duration-200 selection:bg-cyan-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow delay-1000"></div>
      </div>

      <Header />

      <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

          {/* Left Column: Inputs (Controls) */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-6">
            <div className={`
                backdrop-blur-xl bg-white/70 dark:bg-slate-900/60
                rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50
                border border-white/50 dark:border-slate-700/50
                p-6 flex flex-col gap-6 relative transition-all duration-300
                ${inputs.summarizerMode ? 'ring-1 ring-orange-500/30' : ''}
                ${inputs.imageMode ? 'ring-1 ring-cyan-500/30' : ''}
            `}>

              {/* Sheet Config Modal */}
              {isSheetConfigOpen && (
                <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-w-xs w-full">
                    <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit mx-auto mb-4 text-green-600 dark:text-green-400 shadow-lg shadow-green-500/20">
                      <Table size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect Google Sheets</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                      Enter API details for "One-Click Save".
                    </p>
                    <div className="space-y-4 text-left">
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">OAuth Client ID</label>
                        <input
                          type="text"
                          value={sheetConfig.clientId}
                          onChange={(e) => setSheetConfig(prev => ({ ...prev, clientId: e.target.value }))}
                          placeholder="7382...apps.googleusercontent.com"
                          className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Spreadsheet ID</label>
                        <input
                          type="text"
                          value={sheetConfig.spreadsheetId}
                          onChange={(e) => setSheetConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                          placeholder="1BxiM..."
                          className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                      <button onClick={() => setIsSheetConfigOpen(false)} className="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                      <button onClick={handleSheetConfigSave} className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5">Save Config</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Header: Persona & Sheets Link */}
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 p-1.5 rounded-lg">
                      <ScanEye size={20} />
                    </span>
                    Select Persona
                  </h2>

                  <button
                    onClick={() => setIsSheetConfigOpen(true)}
                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all font-medium ${sheetConfig.clientId ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    title="Configure Google Sheets"
                  >
                    <Table size={14} />
                    {sheetConfig.clientId ? 'Sheets Active' : 'Link Sheets'}
                  </button>
                </div>

                <PresetSelector onSelect={handlePresetSelect} selectedId={selectedPresetId} />

                {/* Collapsible System Prompt */}
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-2">
                  <button
                    onClick={() => setIsPromptOpen(!isPromptOpen)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors w-full group"
                  >
                    {isPromptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isPromptOpen ? "Hide System Instructions" : "Reveal / Edit System Instructions"}
                  </button>

                  {isPromptOpen && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
                        System Prompt (Advanced)
                      </label>
                      <textarea
                        name="persona"
                        value={inputs.persona}
                        onChange={handleInputChange}
                        placeholder="Define the AI's identity here..."
                        className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 font-mono shadow-inner"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mode Toggles (Chips) */}
              <div className="flex flex-wrap gap-2 py-2">
                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${inputs.enableDistillation ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300'}`}>
                  <input type="checkbox" name="enableDistillation" checked={inputs.enableDistillation} onChange={handleInputChange} className="hidden" />
                  <FlaskConical size={14} className={inputs.enableDistillation ? 'text-indigo-600' : ''} />
                  Thought Distiller
                </label>

                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${inputs.imageMode ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-300 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-300'}`}>
                  <input type="checkbox" name="imageMode" checked={inputs.imageMode || false} onChange={handleInputChange} className="hidden" />
                  <ScanEye size={14} className={inputs.imageMode ? 'text-cyan-600' : ''} />
                  Vision Mode
                </label>

                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${inputs.batchMode ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-purple-300'}`}>
                  <input type="checkbox" name="batchMode" checked={inputs.batchMode} onChange={handleInputChange} className="hidden" />
                  <Layers size={14} className={inputs.batchMode ? 'text-purple-600' : ''} />
                  Batch Mode
                </label>

                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${inputs.summarizerMode ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-orange-300'}`}>
                  <input type="checkbox" name="summarizerMode" checked={inputs.summarizerMode} onChange={handleInputChange} className="hidden" />
                  <FileSearch size={14} className={inputs.summarizerMode ? 'text-orange-600' : ''} />
                  Summarizer
                </label>

                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${inputs.carouselMode ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-pink-300'}`}>
                  <input type="checkbox" name="carouselMode" checked={inputs.carouselMode} onChange={handleInputChange} className="hidden" />
                  <GalleryVerticalEnd size={14} className={inputs.carouselMode ? 'text-pink-600' : ''} />
                  Carousel
                </label>
              </div>


              {/* Core Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    Content Format
                  </label>
                  <div className="relative">
                    <select
                      name="format"
                      value={inputs.format}
                      onChange={handleInputChange}
                      disabled={inputs.batchMode || inputs.carouselMode || inputs.summarizerMode}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none appearance-none font-medium ${(inputs.batchMode || inputs.carouselMode || inputs.summarizerMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option>LinkedIn Post</option>
                      <option>Twitter/X Thread</option>
                      <option>Instagram Caption</option>
                      <option>Patient Email Newsletter</option>
                      <option>Clinical Blog Post</option>
                      <option>Conference Abstract</option>
                      {(!inputs.batchMode && !inputs.carouselMode && !inputs.summarizerMode && !inputs.imageMode) && <option className="font-bold text-indigo-600 dark:text-indigo-400">Multi-Format Exploder</option>}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                    <ShieldAlert size={14} />
                    Risk Filter
                  </label>
                  <div className="relative">
                    <select
                      name="audience"
                      value={inputs.audience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none font-medium"
                    >
                      <option>Layperson (Patient/Public)</option>
                      <option>Medical Student</option>
                      <option>Licensed Clinician</option>
                      <option>Business Decision-Maker</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
                  </div>
                </div>
              </div>


              {/* Dynamic Input Area */}
              <div className="relative animate-in fade-in duration-300">
                {/* Standard Text Inputs */}
                {!inputs.imageMode && (
                  <>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {inputs.summarizerMode ? 'Summary Goal' : (inputs.batchMode ? 'Topic / Keywords' : 'Topic / Core Idea')}
                      </label>
                      {/* Batch Mode Slider */}
                      {inputs.batchMode && (
                        <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-100 dark:border-purple-800">
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase">Variations: {inputs.batchCount || 3}</span>
                          <input
                            type="range"
                            name="batchCount"
                            min="1"
                            max="5"
                            value={inputs.batchCount || 3}
                            onChange={handleInputChange}
                            className="w-20 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>
                      )}
                      {/* Exam Mode Toggle if Summarizer */}
                      {inputs.summarizerMode && (
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" name="examSummarizerMode" checked={inputs.examSummarizerMode} onChange={handleInputChange} className="w-3.5 h-3.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" />
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Exam Mode</span>
                        </label>
                      )}
                    </div>
                    <textarea
                      name="topic"
                      value={inputs.topic}
                      onChange={handleInputChange}
                      placeholder={inputs.summarizerMode ? "Describe goal..." : "What is this content about?"}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none shadow-inner mb-4 ${inputs.summarizerMode ? 'h-16' : 'h-24'}`}
                    />

                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Shuffle size={14} className="text-indigo-500" />
                        Specific Angle / Hook (Optional)
                      </label>
                      <InfoTooltip text="Break repetitive cycles by defining a specific 'angle'. E.g., 'Controversial', 'Scientific Deep Dive', 'Personal Anecdote', or 'Myth-Busting'." />
                    </div>
                    <input
                      type="text"
                      name="angle"
                      value={inputs.angle || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Controversial, Patient-First, Scientific Deep Dive..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 mb-4"
                    />
                  </>
                )}

                {/* Image Upload Area */}
                {inputs.imageMode && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Upload size={14} />
                      Analysis Image
                    </label>
                    <div className="relative group">
                      {inputs.image ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black/50 flex items-center justify-center">
                          <img src={inputs.image} alt="Analysis Target" className="max-h-full max-w-full object-contain" />
                          <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-40 border-2 border-dashed border-cyan-200 dark:border-cyan-900/50 rounded-xl bg-cyan-50/30 dark:bg-cyan-900/10 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 transition-all group-hover:border-cyan-400"
                        >
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <LucideImage size={24} className="text-cyan-500" />
                          </div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload medical image</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports PNG, JPG, WebP</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    {/* Topic Input is still useful for Vision Mode context */}
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Specific Question / Focus</label>
                      <textarea
                        name="topic"
                        value={inputs.topic}
                        onChange={handleInputChange}
                        placeholder="E.g., What pathology is visible in the upper right quadrant?"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none shadow-inner h-20"
                      />
                    </div>
                  </div>
                )}

                {/* Context / RAG Input */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${inputs.summarizerMode ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      <BookOpen size={14} />
                      {inputs.summarizerMode ? 'Source Text (Required)' : 'Medical Context (Optional)'}
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" name="includeHashtags" checked={inputs.includeHashtags} onChange={handleInputChange} className="w-3.5 h-3.5 text-pink-500 rounded border-slate-300 focus:ring-pink-500" />
                        <span className="text-[10px] font-bold text-slate-500 hover:text-pink-500 transition-colors uppercase">Hashtags</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" name="includeCitations" checked={inputs.includeCitations} onChange={handleInputChange} className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                        <span className="text-[10px] font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase">Citations</span>
                      </label>
                    </div>
                  </div>

                  <textarea
                    name="context"
                    value={inputs.context}
                    onChange={handleInputChange}
                    placeholder={inputs.summarizerMode ? "Paste text to summarize..." : "Paste relevant medical facts..."}
                    className={`w-full px-4 py-3 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none shadow-inner ${inputs.summarizerMode ? 'h-48' : 'h-32'}`} // Increased height for summarizer
                  />
                </div>
              </div>


              {/* Action Bar */}
              <div className="mt-auto pt-4 flex gap-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={handleClear}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 hover:shadow-sm"
                  title="Reset All"
                >
                  <RotateCcw size={18} />
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (inputs.summarizerMode ? !inputs.context : (inputs.imageMode ? !inputs.image : (!inputs.persona || !inputs.topic)))}
                  className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-cyan-500/25 transition-all transform active:scale-[0.98] ${isGenerating || (inputs.summarizerMode ? !inputs.context : (inputs.imageMode ? !inputs.image : (!inputs.persona || !inputs.topic)))
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                    : inputs.imageMode
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500' // Vision Gradient
                      : inputs.batchMode
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500' // Batch Gradient
                        : inputs.carouselMode
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500' // Carousel Gradient
                          : inputs.summarizerMode
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500' // Summarizer Gradient
                            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500' // Default Gradient
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="animate-pulse">Processing...</span>
                    </>
                  ) : (
                    <>
                      {inputs.imageMode ? <ScanEye size={20} /> : <Wand2 size={20} />}
                      <span className="tracking-wide">
                        {inputs.imageMode ? 'Analyze Image' : (inputs.summarizerMode ? 'Summarize' : 'Generate')}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in slide-in-from-bottom-2">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output (Display) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-700/50 flex flex-col h-full min-h-[600px] lg:min-h-0 relative overflow-hidden transition-all duration-300">

              {/* Output Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full shadow-sm transition-colors duration-500 ${generatedResult ? 'bg-green-500 shadow-green-500/50' : 'bg-slate-300 dark:bg-slate-600'} ${isGenerating ? 'animate-ping bg-cyan-400' : ''}`}></div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Generation Result
                    </h3>
                  </div>

                  {/* Drift Score Badge */}
                  {generatedResult?.driftScore !== undefined && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm ${getScoreColor(generatedResult.driftScore)}`}>
                      <ScanEye size={12} />
                      <span>Match: {generatedResult.driftScore}%</span>
                    </div>
                  )}
                </div>

                {generatedResult && !generatedResult.batchOutput && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveToSheet}
                      disabled={isSheetSaving || sheetSaveSuccess}
                      className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all border shadow-sm ${sheetSaveSuccess
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-400 hover:text-green-600 hover:shadow-green-100 dark:hover:shadow-none'
                        }`}
                    >
                      {isSheetSaving ? (
                        <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                      ) : sheetSaveSuccess ? (
                        <CheckCheck size={14} />
                      ) : (
                        <Table size={14} />
                      )}
                      {sheetSaveSuccess ? 'Saved' : 'Save to Sheets'}
                    </button>

                    <button
                      onClick={() => handleCopy()}
                      className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all border shadow-sm ${copySuccess
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-900 hover:shadow-md'
                        }`}
                    >
                      {copySuccess ? <CheckCheck size={14} /> : <Copy size={14} />}
                      {copySuccess ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content Area */}
              <div className="flex-1 px-8 py-8 overflow-y-auto bg-white/50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {generatedResult ? (
                  <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">

                    {/* Distilled Insight Block */}
                    {generatedResult.distilledInsight && (
                      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-5 relative shadow-sm">
                        <div className="absolute top-4 left-4 text-indigo-400 dark:text-indigo-500">
                          <FlaskConical size={18} />
                        </div>
                        <div className="pl-8">
                          <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-400 uppercase tracking-widest mb-2">Core Insight</p>
                          <p className="text-indigo-900 dark:text-indigo-200 font-serif text-lg leading-relaxed italic">
                            "{ensureString(generatedResult.distilledInsight)}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Multi-Format Tabs */}
                    {generatedResult.multiFormatOutput && renderMultiFormatTabs()}

                    {/* Main Content Display */}
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-7">
                      {
                        generatedResult.batchOutput ? (
                          <ul className="space-y-4 list-none p-0">
                            {generatedResult.batchOutput.map((post, idx) => (
                              <li key={idx} className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">Var {idx + 1}</span>
                                  <button onClick={() => handleCopy(post)} className="text-slate-400 hover:text-purple-500"><Copy size={14} /></button>
                                </div>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed prose-p:my-2">
                                  <ReactMarkdown components={markdownComponents}>
                                    {ensureString(post)}
                                  </ReactMarkdown>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : generatedResult.carouselOutput ? (
                          <div className="space-y-8">
                            {generatedResult.carouselOutput.map((slide, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                                <div className="bg-pink-50/50 dark:bg-pink-900/10 px-6 py-4 border-b border-pink-100 dark:border-pink-900/20 flex justify-between items-center">
                                  <span className="font-bold text-pink-700 dark:text-pink-400 text-xs uppercase tracking-widest">Slide {slide.slideNumber}</span>
                                </div>
                                <div className="p-6">
                                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{ensureString(slide.title)}</h4>
                                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed mb-6">
                                    <ReactMarkdown components={markdownComponents}>
                                      {ensureString(slide.content)}
                                    </ReactMarkdown>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-black/20 rounded-lg p-4 border border-slate-100 dark:border-slate-800 flex gap-3">
                                    <div className="mt-1 text-slate-400"><ImageIcon size={16} /></div>
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visual Directive</span>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">{ensureString(slide.visualDescription)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : generatedResult.multiFormatOutput ? (
                          null // Content already rendered inside renderMultiFormatTabs() above
                        ) : (
                          <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-800/30 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <ReactMarkdown components={markdownComponents}>
                              {ensureString(generatedResult.content)}
                            </ReactMarkdown>
                          </div>
                        )
                      }
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none pointer-events-none">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Wand2 size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">Ready to Create</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs mt-2">
                      Select a persona, choose your settings, and let the AI draft your medical content.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Debug Logs Footer */}
      {debugLogs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-green-400 p-2 text-xs font-mono z-50 max-h-32 overflow-y-auto border-t border-green-500/30">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold uppercase tracking-widest text-[#00f2fe]">Internal Debug Stream</span>
            <button onClick={() => setDebugLogs([])} className="hover:text-white">Clear</button>
          </div>
          {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      )}
    </div>
  );
}
