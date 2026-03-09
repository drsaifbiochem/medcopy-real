export interface GenerationInputs {
  persona: string;
  format: string;
  topic: string;
  context: string;
  audience: string;
  includeCitations: boolean;
  enableDistillation: boolean;
  batchMode: boolean;
  batchCount: number;
  carouselMode: boolean;
  includeHashtags: boolean;
  summarizerMode: boolean;
  examSummarizerMode: boolean;
  image?: string;
  imageMode?: boolean;
  posterMode?: boolean;
  reelMode?: boolean;
  advancedAnalysis?: boolean;
  angle?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  personaPrompt: string;
}

export interface GeneratedContent {
  text: string;
  timestamp: number;
}

export interface MultiFormatContent {
  instagram: string;
  linkedin: string;
  email: string;
  twitter: string;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  content: string;
  visualDescription: string;
}

export interface PosterContent {
  headline: string;
  subheadline: string;
  keyPoints: string[];
  callToAction: string;
  visualSuggestions: string;
  footerInfo: string;
}

export interface ReelScript {
  hook: string;
  script: Array<{
    time: string;
    visual: string;
    audio: string;
  }>;
  caption: string;
  hashtags: string[];
}

export interface GenerationResult {
  content: string;
  driftScore?: number;
  driftReasoning?: string;
  distilledInsight?: string;
  multiFormatOutput?: MultiFormatContent;
  batchOutput?: string[];
  carouselOutput?: CarouselSlide[];
  posterOutput?: PosterContent;
  reelOutput?: ReelScript;
}