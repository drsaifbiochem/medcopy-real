import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
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
  GraduationCap
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
    examSummarizerMode: false
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // UI State
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSheetConfigOpen, setIsSheetConfigOpen] = useState(false);

  // Sheet Integration State
  const [sheetConfig, setSheetConfig] = useState({ clientId: '', spreadsheetId: '' });
  const [isSheetSaving, setIsSheetSaving] = useState(false);
  const [sheetSaveSuccess, setSheetSaveSuccess] = useState(false);

  // State for Multi-Format tabs
  const [activeTab, setActiveTab] = useState<'linkedin' | 'instagram' | 'email' | 'twitter'>('linkedin');

  // Initialize API Key checking & Sheet Auth
  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("API Key not found. Please verify environment configuration.");
    }

    // Load saved sheet config from localStorage OR Environment Variables
    const savedClientId = localStorage.getItem('medcopy_google_client_id') || process.env.GOOGLE_CLIENT_ID || '';
    const savedSheetId = localStorage.getItem('medcopy_google_sheet_id') || process.env.GOOGLE_SPREADSHEET_ID || '';

    if (savedClientId && savedSheetId) {
      setSheetConfig({ clientId: savedClientId, spreadsheetId: savedSheetId });
      // Small timeout to ensure google script loaded
      setTimeout(() => initGoogleAuth(savedClientId), 1000);
    }
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    // Debug log to trace Auto-Save conditions
    console.log("[App.tsx] Auto-Save Check:", {
      hasResult: !!generatedResult,
      hasSheetId: !!sheetConfig.spreadsheetId,
      hasClientId: !!sheetConfig.clientId,
      isSaving: isSheetSaving,
      alreadySaved: sheetSaveSuccess
    });

    if (generatedResult && sheetConfig.spreadsheetId && sheetConfig.clientId) {
      if (!isSheetSaving && !sheetSaveSuccess) {
        console.log("[App.tsx] Triggering Auto-Save...");
        handleSaveToSheet();
      }
    }
  }, [generatedResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

    setInputs(prev => {
      let updates: any = { [name]: value };

      // Logic to make Batch Mode, Carousel Mode, and Summarizer Mode mutually exclusive
      if (name === 'batchMode' && value === true) {
        updates.carouselMode = false;
        updates.summarizerMode = false;
        updates.examSummarizerMode = false;
        if (prev.format === 'Multi-Format Exploder') {
          updates.format = 'LinkedIn Post';
        }
      }
      if (name === 'carouselMode' && value === true) {
        updates.batchMode = false;
        updates.summarizerMode = false;
        updates.examSummarizerMode = false;
      }
      if (name === 'summarizerMode' && value === true) {
        updates.batchMode = false;
        updates.carouselMode = false;
      }

      // If disabling summarizer mode, also disable exam mode
      if (name === 'summarizerMode' && value === false) {
        updates.examSummarizerMode = false;
      }

      return { ...prev, ...updates };
    });

    if (name === 'persona') {
      setSelectedPresetId(null);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setInputs(prev => ({ ...prev, persona: preset.personaPrompt }));
    setSelectedPresetId(preset.id);
  };

  const handleGenerate = async () => {
    setError(null);
    setSheetSaveSuccess(false);

    if (inputs.summarizerMode) {
      if (!inputs.context.trim()) {
        setError("Please provide Source Text to summarize.");
        return;
      }
      // For general summarizer, we need a persona. 
      // For Exam Mode, we essentially override the persona with the system prompt, but sticking to a "Student/Teacher" persona from the list is good practice.
      if (!inputs.persona.trim()) {
        setError("Please select a Persona for the summary (or use Exam Mode which overrides style).");
        return;
      }
    } else {
      if (!inputs.persona.trim() || !inputs.topic.trim()) {
        setError("Please provide at least a Persona and a Topic.");
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const result = await generateMedicalCopy(inputs);
      setGeneratedResult(result);
      setActiveTab('linkedin');
    } catch (err: any) {
      setError(err.message || "Failed to generate content.");
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
      examSummarizerMode: false
    });
    setGeneratedResult(null);
    setSelectedPresetId(null);
    setError(null);
    setActiveTab('linkedin');
    setIsPromptOpen(false);
    setSheetSaveSuccess(false);
  };

  const handleSheetConfigSave = () => {
    localStorage.setItem('medcopy_google_client_id', sheetConfig.clientId);
    localStorage.setItem('medcopy_google_sheet_id', sheetConfig.spreadsheetId);
    initGoogleAuth(sheetConfig.clientId);
    setIsSheetConfigOpen(false);
  };

  const handleSaveToSheet = async () => {
    if (!generatedResult) return;
    if (!sheetConfig.spreadsheetId || !sheetConfig.clientId) {
      setIsSheetConfigOpen(true);
      return;
    }

    setIsSheetSaving(true);
    try {
      // Only trigger client-side auth if we are NOT using the Apps Script Proxy
      // AND we don't have an access token yet.
      const hasAppsScript = !!process.env.GOOGLE_APPS_SCRIPT_URL;

      if (!hasAppsScript && !isAuthorized()) {
        triggerAuth();
        // Wait for auth flow (in reality, we'd wait for a callback, but for simplicity we stop here and ask user to click again after popup)
        setIsSheetSaving(false);
        return;
      }

      await saveToSheet(sheetConfig.spreadsheetId, inputs, generatedResult, activeTab);
      setSheetSaveSuccess(true);
      setTimeout(() => setSheetSaveSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to save to Google Sheets. Check console for details.");
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

    return (
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'border-teal-500 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-900/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-6 flex flex-col gap-6 relative transition-colors ${inputs.summarizerMode ? 'border-orange-200 dark:border-orange-900/40' : 'border-slate-200 dark:border-slate-800'}`}>

              {/* Sheet Config Modal Overlay */}
              {isSheetConfigOpen && (
                <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="max-w-xs w-full">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mx-auto mb-4 text-green-600 dark:text-green-400">
                      <Table size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Connect Google Sheets</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Enter your Cloud Console details to enable "One-Click Save".
                    </p>
                    <div className="space-y-3 text-left">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">OAuth Client ID</label>
                        <input
                          type="text"
                          value={sheetConfig.clientId}
                          onChange={(e) => setSheetConfig(prev => ({ ...prev, clientId: e.target.value }))}
                          placeholder="7382...apps.googleusercontent.com"
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Spreadsheet ID</label>
                        <input
                          type="text"
                          value={sheetConfig.spreadsheetId}
                          onChange={(e) => setSheetConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                          placeholder="1BxiM..."
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button onClick={() => setIsSheetConfigOpen(false)} className="flex-1 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">Cancel</button>
                      <button onClick={handleSheetConfigSave} className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700">Save Config</button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    Select Persona
                    <InfoTooltip text="Choose the voice and expertise level for the content generation." />
                  </h2>

                  <button
                    onClick={() => setIsSheetConfigOpen(true)}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sheetConfig.clientId ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                    title="Configure Google Sheets"
                  >
                    <Table size={12} />
                    {sheetConfig.clientId ? 'Sheets Linked' : 'Link Sheets'}
                  </button>
                </div>

                <PresetSelector onSelect={handlePresetSelect} selectedId={selectedPresetId} />

                {/* Collapsible System Prompt */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    onClick={() => setIsPromptOpen(!isPromptOpen)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors w-full"
                  >
                    {isPromptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isPromptOpen ? "Hide System Instructions" : "Reveal / Edit System Instructions"}
                  </button>

                  {isPromptOpen && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">
                        System Prompt (Custom or Preset)
                      </label>
                      <textarea
                        name="persona"
                        value={inputs.persona}
                        onChange={handleInputChange}
                        placeholder="E.g., You are a cynical ER nurse with 10 years experience..."
                        className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ... (Existing Inputs: Format, Audience, etc.) ... */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Content Format
                    <InfoTooltip text="Select structure (e.g. Post, Thread, Email). Disabled in specialized modes." />
                  </label>
                  <select
                    name="format"
                    value={inputs.format}
                    onChange={handleInputChange}
                    disabled={inputs.batchMode || inputs.carouselMode || inputs.summarizerMode}
                    className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 ${(inputs.batchMode || inputs.carouselMode || inputs.summarizerMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option>LinkedIn Post</option>
                    <option>Twitter/X Thread</option>
                    <option>Instagram Caption</option>
                    <option>Patient Email Newsletter</option>
                    <option>Clinical Blog Post</option>
                    <option>Conference Abstract</option>
                    {(!inputs.batchMode && !inputs.carouselMode && !inputs.summarizerMode) && <option className="font-bold text-indigo-700 dark:text-indigo-400">Multi-Format Exploder</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-500">
                    <ShieldAlert size={14} />
                    Audience Risk Filter
                    <InfoTooltip text="Adjusts safety guardrails and technical depth based on who is reading." />
                  </label>
                  <select
                    name="audience"
                    value={inputs.audience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none font-medium"
                  >
                    <option>Layperson (Patient/Public)</option>
                    <option>Medical Student</option>
                    <option>Licensed Clinician</option>
                    <option>Business Decision-Maker</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText size={14} />
                    {inputs.summarizerMode
                      ? 'Summary Goal / Focus (Optional)'
                      : (inputs.batchMode ? 'Keywords / Core Theme' : (inputs.carouselMode ? 'Carousel Topic' : 'Topic / Raw Thought'))}
                    <InfoTooltip text="The core subject or idea you want the AI to write about." />
                  </label>

                  <div className="flex gap-4">
                    {/* Distillation Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        name="enableDistillation"
                        checked={inputs.enableDistillation}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.enableDistillation ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                        <FlaskConical size={12} />
                        Refine
                      </span>
                    </label>

                    {/* Summarizer Mode Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        name="summarizerMode"
                        checked={inputs.summarizerMode}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-orange-600 border-slate-300 dark:border-slate-600 rounded focus:ring-orange-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.summarizerMode ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-400'}`}>
                        <FileSearch size={12} />
                        Summarizer
                      </span>
                    </label>

                    {/* Carousel Mode Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        name="carouselMode"
                        checked={inputs.carouselMode}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-pink-600 border-slate-300 dark:border-slate-600 rounded focus:ring-pink-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.carouselMode ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-pink-500 dark:group-hover:text-pink-400'}`}>
                        <GalleryVerticalEnd size={12} />
                        Carousel
                      </span>
                    </label>

                    {/* Batch Mode Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        name="batchMode"
                        checked={inputs.batchMode}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.batchMode ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400'}`}>
                        <Shuffle size={12} />
                        Batch
                      </span>
                    </label>
                  </div>
                </div>

                <textarea
                  name="topic"
                  value={inputs.topic}
                  onChange={handleInputChange}
                  placeholder={
                    inputs.summarizerMode
                      ? "Describe the goal (e.g. 'Extract clinical pearls' or 'Summarize for a 5-year-old'). Leave empty for general summary."
                      : (inputs.batchMode ? "Enter keywords (e.g. 'Dengue, Prevention, hydration'). We'll generate random angles." : "What is this content about? (e.g., 'The importance of sleep hygiene for cardiac patients')")
                  }
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 ${inputs.batchMode ? 'h-16 ring-1 ring-purple-100 dark:ring-purple-900' : (inputs.carouselMode ? 'h-24 ring-1 ring-pink-100 dark:ring-pink-900' : (inputs.summarizerMode ? 'h-16 ring-1 ring-orange-100 dark:ring-orange-900' : 'h-24'))}`}
                />

                {/* Batch Count Slider */}
                {inputs.batchMode && (
                  <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                        <Dice5 size={12} />
                        Generate {inputs.batchCount} Random Variations
                      </label>
                      <span className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">{inputs.batchCount} Posts</span>
                    </div>
                    <input
                      type="range"
                      name="batchCount"
                      min="1"
                      max="10"
                      value={inputs.batchCount}
                      onChange={(e) => handleInputChange(e as any)}
                      className="w-full h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
                    />
                  </div>
                )}

                {inputs.enableDistillation && !inputs.batchMode && !inputs.carouselMode && !inputs.summarizerMode && (
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1">
                    <FlaskConical size={10} />
                    Distiller enabled: Will refine raw notes into a core insight before generating content.
                  </p>
                )}
                {inputs.format === 'Multi-Format Exploder' && !inputs.batchMode && !inputs.carouselMode && !inputs.summarizerMode && (
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-1.5 flex items-center gap-1 font-medium">
                    <Layers size={10} />
                    Exploder Active: One topic → 4 platforms (IG, LinkedIn, Email, Twitter).
                  </p>
                )}
                {inputs.carouselMode && (
                  <p className="text-[10px] text-pink-600 dark:text-pink-400 mt-1.5 flex items-center gap-1 font-medium">
                    <GalleryVerticalEnd size={10} />
                    Carousel Mode: Generating slide-by-slide structure.
                  </p>
                )}
                {inputs.summarizerMode && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 font-medium">
                      <FileSearch size={10} />
                      Summarizer Mode: Paste source text below to extract persona-driven insights.
                    </p>

                    {/* Exam Mode Toggle (Nested inside Summarizer info) */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer group select-none bg-orange-50 dark:bg-orange-900/20 p-2 rounded-md border border-orange-100 dark:border-orange-900/30 w-fit">
                      <input
                        type="checkbox"
                        name="examSummarizerMode"
                        checked={inputs.examSummarizerMode}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-orange-600 border-slate-300 dark:border-slate-600 rounded focus:ring-orange-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${inputs.examSummarizerMode ? 'text-orange-700 dark:text-orange-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
                        <GraduationCap size={14} />
                        Subtitle/Exam Mode (NEET-PG/USMLE)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-sm font-medium flex items-center gap-1.5 ${inputs.summarizerMode ? 'text-orange-700 dark:text-orange-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                    <BookOpen size={14} />
                    {inputs.summarizerMode ? 'Source Text to Summarize (Required)' : 'Medical Context (RAG / Reference)'}
                    <InfoTooltip text={inputs.summarizerMode ? "Paste the full text here." : "Paste facts/studies here. AI will strictly adhere to this context."} />
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Hashtags Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="includeHashtags"
                        checked={inputs.includeHashtags}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-pink-500 border-slate-300 dark:border-slate-600 rounded focus:ring-pink-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.includeHashtags ? 'text-pink-600 dark:text-pink-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-pink-600 dark:group-hover:text-pink-400'}`}>
                        <Hash size={12} />
                        Smart Hashtags
                      </span>
                    </label>

                    {/* Auto-Citations Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="includeCitations"
                        checked={inputs.includeCitations}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-teal-600 border-slate-300 dark:border-slate-600 rounded focus:ring-teal-500 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors flex items-center gap-1 ${inputs.includeCitations ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                        <Quote size={12} />
                        Auto-Citations
                      </span>
                    </label>
                  </div>
                </div>
                <textarea
                  name="context"
                  value={inputs.context}
                  onChange={handleInputChange}
                  placeholder={
                    inputs.examSummarizerMode
                      ? "Paste timestamped transcripts or subtitles (e.g. '00:11:06 This is important...'). We will extract the high-yield topics."
                      : (inputs.summarizerMode ? "Paste the full text, article, or notes you want to summarize here..." : "Paste verified medical facts, study results, or guidelines here. The AI will strictly adhere to this context for accuracy.")
                  }
                  className={`w-full px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none placeholder:text-amber-800/50 dark:placeholder:text-amber-500/50 text-slate-800 dark:text-amber-100 ${inputs.summarizerMode ? 'h-64 ring-2 ring-orange-200 dark:ring-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10' : 'h-32'}`}
                />
                {!inputs.summarizerMode && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={10} />
                    Strict Mode: AI will limit claims to this provided context.
                  </p>
                )}
              </div>

              <div className="mt-auto pt-2 flex gap-3">
                <button
                  onClick={handleClear}
                  className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (inputs.summarizerMode ? !inputs.context : (!inputs.persona || !inputs.topic))}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${isGenerating || (inputs.summarizerMode ? !inputs.context : (!inputs.persona || !inputs.topic))
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                    : inputs.batchMode
                      ? 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
                      : inputs.carouselMode
                        ? 'bg-pink-600 hover:bg-pink-700 hover:shadow-lg'
                        : inputs.summarizerMode
                          ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg'
                          : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg active:transform active:scale-[0.98]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {inputs.batchMode
                        ? <Shuffle size={18} />
                        : (inputs.carouselMode
                          ? <GalleryVerticalEnd size={18} />
                          : (inputs.summarizerMode
                            ? (inputs.examSummarizerMode ? <GraduationCap size={18} /> : <FileSearch size={18} />)
                            : (inputs.format === 'Multi-Format Exploder' ? <Layers size={18} /> : <Wand2 size={18} />)
                          )
                        )
                      }
                      {inputs.batchMode
                        ? `Generate ${inputs.batchCount} Variations`
                        : (inputs.carouselMode
                          ? 'Generate Carousel'
                          : (inputs.summarizerMode
                            ? 'Summarize Text'
                            : (inputs.format === 'Multi-Format Exploder' ? 'Explode Content' : 'Generate Draft')
                          )
                        )
                      }
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-[600px] lg:min-h-0 relative overflow-hidden">

              {/* Output Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${generatedResult ? (generatedResult.batchOutput ? 'bg-purple-500' : (generatedResult.carouselOutput ? 'bg-pink-500' : 'bg-teal-500')) : 'bg-slate-300 dark:bg-slate-600'} ${isGenerating ? 'animate-pulse' : ''}`}></div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {generatedResult?.multiFormatOutput
                        ? 'Multi-Format Output'
                        : (generatedResult?.batchOutput
                          ? 'Random Batch Output'
                          : (generatedResult?.carouselOutput
                            ? 'Carousel Output'
                            : (inputs.summarizerMode && generatedResult ? 'Summary Result' : 'Output Preview')))}
                    </h3>
                  </div>

                  {/* Drift Score Badge */}
                  {generatedResult?.driftScore !== undefined && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getScoreColor(generatedResult.driftScore)}`}>
                      <ScanEye size={12} />
                      <span>Persona Match: {generatedResult.driftScore}%</span>
                    </div>
                  )}
                </div>

                {generatedResult && !generatedResult.batchOutput && (
                  <div className="flex items-center gap-2">
                    {/* Google Sheets Save Button */}
                    <button
                      onClick={handleSaveToSheet}
                      disabled={isSheetSaving || sheetSaveSuccess}
                      className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border ${sheetSaveSuccess
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400'
                        }`}
                    >
                      {isSheetSaving ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                      ) : sheetSaveSuccess ? (
                        <CheckCheck size={14} />
                      ) : (
                        <Table size={14} />
                      )}
                      {sheetSaveSuccess ? 'Saved!' : 'Save to Sheets'}
                    </button>

                    <button
                      onClick={() => handleCopy()}
                      className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border ${copySuccess
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      {copySuccess ? <CheckCheck size={14} /> : <Copy size={14} />}
                      {copySuccess ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content */}
              <div className="flex-1 px-8 py-6 overflow-y-auto bg-white dark:bg-slate-900">
                {generatedResult ? (
                  <div className="flex flex-col gap-6">
                    {/* Distilled Insight Block */}
                    {generatedResult.distilledInsight && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 relative">
                        <div className="absolute top-3 left-3 text-indigo-400">
                          <FlaskConical size={16} />
                        </div>
                        <div className="pl-7">
                          <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide mb-1">Thought Distiller Insight</p>
                          <p className="text-indigo-900 dark:text-indigo-200 font-medium text-sm leading-relaxed italic">
                            "{generatedResult.distilledInsight}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab Content for Multi-Format */}
                    {generatedResult.multiFormatOutput && renderMultiFormatTabs()}

                    {/* Batch Output Rendering */}
                    {generatedResult.batchOutput ? (
                      <div className="space-y-6">
                        {generatedResult.batchOutput.map((post, index) => (
                          <div key={index} className="group relative bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800">
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(post);
                                  setCopySuccess(true);
                                  setTimeout(() => setCopySuccess(false), 2000);
                                }}
                                className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-purple-600 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm"
                                title="Copy this post"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <div className="absolute -left-3 top-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded shadow-sm border border-purple-200 dark:border-purple-800">
                              #{index + 1}
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-slate-800 dark:text-slate-200 pl-2">
                              {post}
                            </pre>
                          </div>
                        ))}

                        {/* Save to Sheets button for batch mode */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={handleSaveToSheet}
                            disabled={isSheetSaving || sheetSaveSuccess}
                            className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border ${sheetSaveSuccess
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400'
                              }`}
                          >
                            {isSheetSaving ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                            ) : sheetSaveSuccess ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Table size={14} />
                            )}
                            {sheetSaveSuccess ? 'Saved!' : 'Save to Sheets'}
                          </button>
                        </div>
                      </div>
                    ) : generatedResult.carouselOutput ? (
                      /* Carousel Output Rendering */
                      <div className="space-y-4">
                        {generatedResult.carouselOutput.map((slide) => (
                          <div key={slide.slideNumber} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40">
                            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slide {slide.slideNumber}</span>
                              <div className="h-2 w-2 rounded-full bg-pink-400"></div>
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{slide.title}</h4>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-4 leading-relaxed">{slide.content}</p>

                              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 text-sm text-pink-800 dark:text-pink-300 flex gap-3 border border-pink-100 dark:border-pink-900/30">
                                <div className="shrink-0 mt-0.5"><ImageIcon size={16} /></div>
                                <div>
                                  <span className="block text-xs font-bold uppercase mb-0.5 opacity-70">Visual Cue</span>
                                  {slide.visualDescription}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard Content */
                      <div className="prose prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-teal-600 max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-slate-800 dark:text-slate-200">
                          {generatedResult.multiFormatOutput
                            ? generatedResult.multiFormatOutput[activeTab]
                            : generatedResult.content}
                        </pre>
                      </div>
                    )}

                    {generatedResult.driftReasoning && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 mt-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Analysis:</span>
                        {generatedResult.driftReasoning}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <Wand2 size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">Ready to generate medical copy</p>
                    <p className="text-xs max-w-xs text-center mt-2 opacity-60">
                      Configure your persona and topic on the left to begin content creation.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Disclaimers */}
              <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 text-[10px] text-slate-400 dark:text-slate-600 flex justify-between items-center">
                <span>Generated by MedCopy AI Engine</span>
                <span className="flex items-center gap-1"><AlertCircle size={10} /> Content requires clinical review.</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Icon helper since lucide-react User isn't exported as UserIcon sometimes depending on version or conflict
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);