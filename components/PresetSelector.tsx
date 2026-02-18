import React, { useState, useRef, useEffect } from 'react';
import { User, Lightbulb, HeartPulse, Brain, Award, Rocket, Cpu, Building2, ChevronDown, Check } from 'lucide-react';
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

  const getIcon = (id: string, className = "w-4 h-4") => {
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
    <div className="relative mb-6" ref={dropdownRef}>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-teal-500 dark:hover:border-teal-500 transition-colors text-left group"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                 <div className={`p-1.5 rounded-md shrink-0 transition-colors ${selectedId ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                    {selectedPreset ? getIcon(selectedPreset.id) : <User className="w-4 h-4"/>}
                 </div>
                 <div className="truncate">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {selectedPreset ? selectedPreset.name : "Select a Persona..."}
                    </span>
                    {selectedPreset && (
                         <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                            {selectedPreset.description}
                         </span>
                    )}
                 </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                {PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => {
                            onSelect(preset);
                            setIsOpen(false);
                        }}
                        className={`w-full flex items-start p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${selectedId === preset.id ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                    >
                         <div className={`mt-0.5 mr-3 p-1.5 rounded-md shrink-0 ${
                            selectedId === preset.id 
                            ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                            {getIcon(preset.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-semibold truncate ${selectedId === preset.id ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-slate-200'}`}>
                                    {preset.name}
                                </span>
                                {selectedId === preset.id && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {preset.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};