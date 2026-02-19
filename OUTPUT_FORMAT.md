# OUTPUT_FORMATTING.md

> **Status:** Active **Renderer:** react-markdown **Styles:** Tailwind Typography (prose)

---

## 🛡️ Deep Hardening & Resilience

To prevent **React Error #31** (Objects as children), MedCopy implements a mandatory stringification layer:

1. **API Flattening** : All non-array objects returned by the LLM are recursively cleaned.
2. **Smarter Flattening** : If an object contains keys like `title`, `post`, or `content`, it is merged into a clean Markdown block:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60">markdown</div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk3">## [</span><span class="mtk13">Title</span><span class="mtk3">]</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">[</span><span class="mtk13">Content</span><span class="mtk1">]</span></div></div></div></div></div></div></pre>

1. **Recursive Guards** : The system ensures `carouselOutput`, `batchOutput`, and `multiFormatOutput` variants are valid strings.
2. **Frontend Fallback** : The

   ensureString helper in

   App.tsx provides a final rendering guard for all mapping loops.

### Handling Structured Mistakes

If the model hallucinates a dictionary instead of a paragraph:

* **Input** : `{ "intro": "Hello", "body": "World" }`
* **Output** : `**INTRO**: Hello\n\n**BODY**: World` (Fallback flattening)
* **Input (Smarter)** : `{ "title": "Welcome", "post": "Hello World" }`
* **Output** : `## Welcome\n\nHello World` (Refined flattening)

## 1. Overview

MedCopy AI Studio uses strict standardized formatting to ensure all generated content—whether from Text, Vision, or Summary modes—is clean, professional, and easy to read. Raw plain text is no longer used for display; instead, we render rich Markdown.

## 2. Formatting Standards

### 2.1 Structure (Markdown)

The AI models (`gemma-3-27b-it`) are instructed to output strict Markdown.

* **Headers:** Use `## Title` for section headers. (H1 is reserved for the page title).
* **Emphasis:** Use `**Bold**` for key terms, medical findings, or calls to action.
* **Lists:** Use `- Item` or `1. Item` for bullet points.
* **Spacing:** Double line breaks between paragraphs for readability.

### 2.2 Vision Output

Vision mode specifically injects the following instruction to prevent "wall of text" outputs:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60">typescript</div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk15">FORMATTING</span><span class="mtk1"> REQUIREMENTS:</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">-</span><span class="mtk1"></span><span class="mtk4">Use</span><span class="mtk1"></span><span class="mtk4">Markdown</span><span class="mtk1"></span><span class="mtk13">Headers</span><span class="mtk1"> (##) </span><span class="mtk4">to</span><span class="mtk1"></span><span class="mtk4">structure</span><span class="mtk1"></span><span class="mtk4">the</span><span class="mtk1"></span><span class="mtk4">analysis</span><span class="mtk1">.</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk16">-</span><span class="mtk1"></span><span class="mtk4">Use</span><span class="mtk1"></span><span class="mtk4">Bullet</span><span class="mtk1"></span><span class="mtk4">Points</span><span class="mtk1"></span><span class="mtk4">for</span><span class="mtk1"></span><span class="mtk4">clarity</span><span class="mtk1">.</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk16">-</span><span class="mtk1"></span><span class="mtk4">Use</span><span class="mtk1"></span><span class="mtk16">**</span><span class="mtk4">Bold</span><span class="mtk16">**</span><span class="mtk1"></span><span class="mtk4">for</span><span class="mtk1"></span><span class="mtk4">key</span><span class="mtk1"></span><span class="mtk4">findings</span><span class="mtk1"></span><span class="mtk4">or</span><span class="mtk1"></span><span class="mtk4">emphasis</span><span class="mtk1">.</span></div></div></div></div></div></div></pre>

### 2.3 Additional Features

* **Hashtags:** If selected, 5-10 hashtags are appended at the bottom.
* **Citations:** If selected, strict medical citations are included.

## 3. Anti-AI Style Enforcement (V2)

MedCopy now implements a **Spartan/Informative** Humanizer Layer. The `ANTI_AI_STYLE` instruction block is hardcoded into every generation prompt.

### 3.1 Core Principles

* **Spartan & Informative:** Short, impactful sentences. No fluff.
* **Active Voice:** Passive voice is strictly forbidden.
* **Direct Address:** Always use "you" and "your".
* **No Em Dashes:** Use commas or periods. No em dashes (—).
* **No Clichés:** No metaphors, generalizations, or rhetorical questions.

### 3.2 Banned Vocabulary (Strict)

The model is explicitly instructed to **AVOID** the following words:

> can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving

## 4. Technical Implementation

### 4.1 Frontend Renderer

We use `react-markdown` to parse the AI's response string into HTML elements.

**File:**

App.tsx

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60">tsx</div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk3">import</span><span class="mtk1"></span><span class="mtk4">ReactMarkdown</span><span class="mtk1"></span><span class="mtk3">from</span><span class="mtk1"></span><span class="mtk6">'react-markdown'</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk8">// ...</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"><</span><span class="mtk4">div</span><span class="mtk1"></span><span class="mtk5 mtki">className</span><span class="mtk1">=</span><span class="mtk6">"prose prose-slate dark:prose-invert max-w-none ..."</span><span class="mtk1">></span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1"></span><span class="mtk1"><</span><span class="mtk14">ReactMarkdown</span><span class="mtk1">></span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1"></span><span class="mtk3">{</span><span class="mtk4">generatedResult</span><span class="mtk1">.</span><span class="mtk4">content</span><span class="mtk3">}</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1"></span><span class="mtk1"></</span><span class="mtk14">ReactMarkdown</span><span class="mtk1">></span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1"></</span><span class="mtk4">div</span><span class="mtk1">></span></div></div></div></div></div></div></pre>

### 4.2 Styling (Custom Components)

We use a custom `components` mapping in `ReactMarkdown` to inject our "Premium" design tokens directly into the output:

* **Headings (H1/H2):** Large, bold `slate-900` text with a subtle `slate-200` underline for hierarchy.
* **Lists (`ul/li`):** Custom bullet points using `cyan-500` dots (`w-1.5 h-1.5 rounded-full`) for a modern, clean look.
* **Emphasis (

  strong):** Highlights key text in `cyan-700` (Dark: `cyan-400`) to draw attention to medical findings.
* **Blockquotes:** Styled as "Medical Notes" with a `border-l-4 border-cyan-500` and `bg-cyan-50`, perfect for clinical observations.

## 5. Troubleshooting

| Issue                                    | Cause                                                  | Fix                                                                        |
| ---------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Visible `##` or `**` chars** | `react-markdown` missing or not wrapping the output. | Ensure**App.tsx** uses `<ReactMarkdown>{content}</ReactMarkdown>`. |
| **Unstyled Text**                  | Missing `@tailwindcss/typography`.                   | Check**tailwind.config.js** plugins list.                            |
| **Dark text on Dark Mode**         | Missing `dark:prose-invert`.                         | Add this class to the parent `div`.                                      |
