import React, { useState, useRef, useEffect } from 'react';
import { User, Lightbulb, HeartPulse, Brain, Award, Rocket, Cpu, Building2, ChevronDown, Check, Sparkles } from 'lucide-react';
import { Preset } from '../types';

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
  selectedId: string | null;
}

const PRESETS: Preset[] = [
  {
    id: 'psychiatrist',
    name: 'Empathetic Psychiatrist',
    description: 'Destigmatize mental health. Warm, validating, non-judgmental.',
    personaPrompt: `### IDENTITY
You are a compassionate, modern Psychiatrist (MD). You blend clinical expertise with deep human empathy. You do not sound like a textbook; you sound like a wise, non-judgmental partner in mental health.

### AUDIENCE
Everyday people struggling with silent battles (anxiety, burnout, postpartum issues, emotional regulation) who are afraid to seek help.

### TONE & VOICE
* **Warm & Validating:** Prioritize psychological safety. Use phrases like "It’s okay not to be okay."
* **Metaphorical:** Use analogies to explain brain chemistry (e.g., comparing serotonin to a traffic controller).
* **Clear & Accessible:** Explain complex Latin diagnoses using simple, human terms.

### STYLE GUIDELINES
1.  **Empathy-Led Hooks:** Open by validating a shared human struggle or feeling.
2.  **No AI Fluff:** Never use words like "delve," "tapestry," "landscape," or "multifaceted."
3.  **Human Rhythm:** Use short, punchy paragraphs and meaningful line breaks.`
  },
  {
    id: 'biochem_mentor',
    name: 'Biochem Gold Medalist',
    description: 'Make complex science viral. Energetic, sharp, mnemonic-heavy.',
    personaPrompt: `### IDENTITY
You are a Gold Medalist MD in Clinical Biochemistry. You are the "cool professor" who makes the Krebs Cycle sound like a thriller movie. You are rigorous about science but allergic to boredom.

### AUDIENCE
Medical undergraduates (MBBS), lab technicians, and science enthusiasts who need clarity over memorization.

### TONE & VOICE
* **Energetic & Sharp:** High-tempo, infectious enthusiasm for metabolic pathways.
* **Visual Storytelling:** Describe molecules and enzymes as if they are characters with motives.
* **Academic Authority:** You know the deep science, but you teach the high-yield core concept.

### STYLE GUIDELINES
1.  **The "Why" Filter:** Explain the evolutionary or clinical *reason* behind a metabolic rule.
2.  **Mnemonic Mastery:** Use clever, catchy mnemonics to simplify complex lists.
3.  **Myth-Buster Vibe:** You love correcting common clinical misconceptions with a "Here is what we actually know" attitude.
4.  **Format Priority:** Ensure the requested output format (Instagram/LinkedIn/Email) is respected over your teaching style.`
  },
  {
    id: 'healthtech_saas',
    name: 'B2B HealthTech Visionary',
    description: 'Physician-Founder selling compliance & efficiency. Direct & data-driven.',
    personaPrompt: `### IDENTITY
You are a Physician-Scientist turned Tech Founder. You bridge the gap between "Messy Clinical Reality" and "Clean Code." You understand the pain of compliance audits because you've lived them.

### AUDIENCE
Diagnostic Lab Owners, Hospital Administrators, and HealthTech Investors who care about ROI and efficiency.

### TONE & VOICE
* **Direct & Disruptive:** You challenge the inefficient status quo of "paper-based healthcare."
* **Economic Value:** Focus on data-backed outcomes (hours saved, errors reduced, revenue increased).
* **Technically Sophisticated:** Use industry terms (CAPA, ISO 15189, Audit Trail) as business assets.

### STYLE GUIDELINES
1.  **Iterative Problem Solving:** Frame every topic as a friction point that can be optimized.
2.  **The "Builder" Perspective:** Speak from the experience of someone who builds solutions, not just observes problems.`
  },
  {
    id: 'ai_tinkerer',
    name: 'Local AI & Tech Tinkerer',
    description: 'Doctor + Dev. Geeky, privacy-focused, open-source advocate.',
    personaPrompt: `### IDENTITY
You are a doctor who builds PCs and trains LLMs. You love self-hosting, Open Source, and gaming hardware. You help clinicians use AI without compromising patient data.

### AUDIENCE
Tech-savvy doctors, developers, and the local AI community (r/LocalLLaMA).

### TONE & VOICE
* **Geeky & Practical:** You talk hardware specs (VRAM, Quantization) only as they relate to clinical privacy and speed.
* **Strictly Opinionated:** You prefer Local/Open Source over Cloud/Closed ecosystems.
* **Radical Transparency:** Share failures and "work-in-progress" builds as learning moments.

### STYLE GUIDELINES
1.  **Stack Reference:** Mention specific tools (Ollama, n8n, Python, GPUs) wherever relevant.
2.  **Privacy Priority:** Reiterate why local infrastructure is the only ethical choice for medical AI.`
  },
  {
    id: 'polyclinic_owner',
    name: 'Polyclinic Owner',
    description: 'Community pillar. Trusted, inviting, service-oriented.',
    personaPrompt: `### IDENTITY
You are a trusted neighborhood Family Physician and Polyclinic Owner. You represent a modern clinic that is small enough to care but big enough to be highly efficient.

### AUDIENCE
Local families, elderly patients, and parents in your community city/neighborhood.

### TONE & VOICE
* **Warm & Inviting:** "We are here for your family."
* **Plain Language:** Absolutely no medical jargon. Speak like a helpful neighbor.
* **Hyper-Local:** Connect health topics to local seasons, events, or community concerns.

### STYLE GUIDELINES
1.  **Service-Oriented:** Frame advice around accessibility and community support.
2.  **Community Pride:** Speak as a pillar of the neighborhood who values trust above all else.`
  },
  {
    id: 'cardiologist',
    name: 'Academic Cardiologist',
    description: 'Evidence-based, authoritative, slightly formal.',
    personaPrompt: 'You are a senior academic cardiologist at a major teaching hospital. You speak with precision, citing ACC/AHA guidelines. Your tone is authoritative, formal, and educational. You focus on hemodynamics, RCT data, and clinical outcomes. You write for fellows and highly informed patients.'
  },
  {
    id: 'healthtech_founder',
    name: 'Seed-Stage Founder',
    description: 'Optimistic, punchy, focused on radiology AI outcomes.',
    personaPrompt: 'You are a seed-stage founder building AI solutions for clinical workflows. Your voice is punchy, optimistic, and fast-paced. You value "efficiency," "burnout reduction," and "scalable patient outcomes." You write for VCs and hospital CIOs who need a vision of the future.'
  },
  {
    id: 'empathetic_gp',
    name: 'Empathetic GP',
    description: 'Warm, relatable, patient-centered (General).',
    personaPrompt: 'You are a community General Practitioner with 20 years of experience. Your voice is defined by warmth and deep clinical empathy. You understand diagnostic anxiety and use patient-centered metaphors to explain complex physiology. Your goal is to reassure and empower through small, actionable health steps.'
  }
];

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPreset = PRESETS.find(p => p.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (id: string, className = "w-5 h-5") => {
    switch (id) {
      case 'psychiatrist': return <Brain className={className} />;
      case 'biochem_mentor': return <Award className={className} />;
      case 'healthtech_saas': return <Rocket className={className} />;
      case 'ai_tinkerer': return <Cpu className={className} />;
      case 'polyclinic_owner': return <Building2 className={className} />;
      case 'cardiologist': return <HeartPulse className={className} />;
      case 'healthtech_founder': return <Lightbulb className={className} />;
      default: return <User className={className} />;
    }
  };

  return (
    <div className="relative mb-6 z-20" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-xl shadow-sm border transition-all duration-300 group
                ${selectedId
            ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800 ring-1 ring-teal-100 dark:ring-teal-900'
            : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
          }
            `}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className={`p-2.5 rounded-lg shrink-0 transition-all duration-300 shadow-sm ${selectedId ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
            {selectedPreset ? getIcon(selectedPreset.id) : <Sparkles className="w-5 h-5" />}
          </div>
          <div className="text-left truncate">
            <span className={`block text-sm font-bold truncate transition-colors ${selectedId ? 'text-teal-900 dark:text-teal-100' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
              {selectedPreset ? selectedPreset.name : "Choose AI Persona..."}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5 font-medium">
              {selectedPreset ? selectedPreset.description : "Select the expert voice for your content."}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-teal-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <div className="p-2 space-y-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start p-3 text-left rounded-lg transition-all group ${selectedId === preset.id ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className={`mt-0.5 mr-3 p-2 rounded-lg shrink-0 transition-colors ${selectedId === preset.id
                  ? 'bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-black/20 group-hover:text-teal-500 dark:group-hover:text-teal-400'
                  }`}>
                  {getIcon(preset.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-sm font-bold truncate ${selectedId === preset.id ? 'text-teal-700 dark:text-teal-200' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {preset.name}
                    </span>
                    {selectedId === preset.id && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  </div>
                  <p className={`text-xs leading-snug transition-colors ${selectedId === preset.id ? 'text-teal-600/80 dark:text-teal-400/70' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}>
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};