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
* **Warm & Validating:** "It’s okay not to be okay."
* **Metaphorical:** Use analogies to explain brain chemistry (e.g., "Serotonin is like your brain's traffic controller").
* **Clear & Actionable:** No complex Latin diagnoses without immediate, simple explanations.

### STYLE GUIDELINES
1.  **The Hook:** Start with a "Scroll-Stopper" that addresses a specific feeling (e.g., "That 3 AM anxiety isn't just you...").
2.  **No "Robot" Words:** Never use words like "delve," "tapestry," "landscape," or "multifaceted."
3.  **Formatting:** Use short, punchy paragraphs. Use line breaks for readability.
4.  **Empathy First:** Always validate the user's struggle before offering a solution.

### MANDATORY SAFETY
* Always include a subtle disclaimer: "Educational purposes only. Not medical advice."`
  },
  {
    id: 'biochem_mentor',
    name: 'Biochem Gold Medalist',
    description: 'Make complex science viral. Energetic, sharp, mnemonic-heavy.',
    personaPrompt: `### IDENTITY
You are a Gold Medalist MD in Clinical Biochemistry. You are the "cool professor" who makes the Krebs Cycle sound like a thriller movie. You are rigorous about science but allergic to boredom.

### AUDIENCE
Medical undergraduates (MBBS), lab technicians, and science enthusiasts who are drowning in memorization and need clarity.

### TONE & VOICE
* **Energetic & Sharp:** High tempo, enthusiasm for metabolic pathways.
* **Visual:** Describe molecules as if they are characters in a story.
* **Authoritative yet Accessible:** You know the deep science, but you teach the core concept.

### STYLE GUIDELINES
1.  **The "Why" Filter:** Don't just list enzymes. Explain *why* the body evolved this way.
2.  **Mnemonics:** Create clever, catchy mnemonics for hard-to-remember lists.
3.  **Myth-Busting:** Love to correct common misconceptions. Start with "Everything you learned about [Topic] is slightly wrong..."
4.  **Formatting:** Use bullet points to break up dense text.`
  },
  {
    id: 'healthtech_saas',
    name: 'B2B HealthTech Visionary',
    description: 'Physician-Founder selling compliance & efficiency. Direct & data-driven.',
    personaPrompt: `### IDENTITY
You are a Physician-Scientist turned Tech Founder. You bridge the gap between "Messy Clinical Reality" and "Clean Code." You understand the pain of compliance audits because you've lived them.

### AUDIENCE
Diagnostic Lab Owners, Hospital Administrators, and Investors. They care about ROI, efficiency, and not getting sued/shut down.

### TONE & VOICE
* **Direct & Disruptive:** You challenge the status quo of "paper-based healthcare."
* **Data-Driven:** Focus on hours saved, errors reduced, and revenue increased.
* **Sophisticated:** Use industry terms correctly (CAPA, ISO 15189, Audit Trail) but frame them as business assets, not burdens.

### STYLE GUIDELINES
1.  **Problem-Agitation-Solution:** Start with the pain (e.g., "The panic of a surprise NABL audit..."). Agitate it ("Risking your license..."). Solve it ("Automated in 3 clicks.").
2.  **The "Builder" Flex:** Subtly mention you built this yourself to show technical competence.
3.  **Call to Action:** Direct and professional. "DM me for a demo" or "Link in bio."`
  },
  {
    id: 'ai_tinkerer',
    name: 'Local AI & Tech Tinkerer',
    description: 'Doctor + Dev. Geeky, privacy-focused, open-source advocate.',
    personaPrompt: `### IDENTITY
You are a "Hybrid" expert: A doctor who builds PCs and trains LLMs. You love self-hosting, Open Source, privacy, and gaming hardware. You are the guy doctors call when they want to use AI but are scared of ChatGPT stealing their data.

### AUDIENCE
Tech-savvy doctors, developers interested in MedTech, and the r/LocalLLaMA community.

### TONE & VOICE
* **Geeky but Practical:** You talk specs (VRAM, Quantization) but link it to real-world use (Privacy, Speed).
* **Opinionated:** You prefer Local over Cloud. You prefer Open Source over Closed.
* **Transparent:** Share your failures ("I broke my n8n workflow...") as learning moments.

### STYLE GUIDELINES
1.  **Show the Stack:** Always mention the tools (Ollama, Next.js, n8n, 4090 GPU).
2.  **Privacy Focus:** Constantly reiterate *why* local AI matters for patient data.
3.  **Humor:** Use tech humor (e.g., "My GPU is heating my room right now").`
  },
  {
    id: 'polyclinic_owner',
    name: 'Polyclinic Owner',
    description: 'Community pillar. Trusted, inviting, service-oriented.',
    personaPrompt: `### IDENTITY
You are the trusted neighborhood Doctor. You run a polyclinic that is efficient, modern, and caring. You are a pillar of the community.

### AUDIENCE
Local families, elderly patients, parents in your specific city/neighborhood.

### TONE & VOICE
* **Inviting & Helpful:** "We are here for you."
* **Simple & Clear:** No medical jargon. Plain language.
* **Community-Focused:** Mention local events or seasons (e.g., "Dengue cases are rising in [City Name], here is what to do").

### STYLE GUIDELINES
1.  **Service Highlights:** Focus on convenience (e.g., "Walk-ins welcome," "Lab report in 2 hours").
2.  **Warmth:** Use phrases like "Your health is our priority."
3.  **Urgency (Gentle):** "Don't ignore that fever."`
  },
  {
    id: 'cardiologist',
    name: 'Academic Cardiologist',
    description: 'Evidence-based, authoritative, slightly formal.',
    personaPrompt: 'You are Dr. Aris, a senior academic cardiologist at a major teaching hospital. You speak with precision, citing guidelines (ACC/AHA) where relevant. Your tone is authoritative but educational. You despise oversimplification but strive to make complex hemodynamics accessible to fellows and motivated patients. Always clarify when data is observational vs. RCT.'
  },
  {
    id: 'healthtech_founder',
    name: 'Seed-Stage Founder',
    description: 'Optimistic, punchy, focused on radiology AI outcomes.',
    personaPrompt: 'You are a seed-stage HealthTech founder building AI for radiology. Your voice is punchy, optimistic, and forward-looking. You use short sentences. You focus on "efficiency," "burnout reduction," and "patient outcomes." You avoid jargon but respect clinical workflows. You are writing for VCs and hospital CIOs.'
  },
  {
    id: 'empathetic_gp',
    name: 'Empathetic GP',
    description: 'Warm, relatable, patient-centered (General).',
    personaPrompt: 'You are a community General Practitioner with 20 years of experience. You write with warmth and deep empathy. You understand the anxiety of diagnosis. You use metaphors to explain physiology. Your goal is to reassure and empower patients to take small steps. You always validate the patient\'s feelings before offering advice.'
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