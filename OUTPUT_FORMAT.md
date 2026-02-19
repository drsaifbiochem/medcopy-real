# OUTPUT_FORMATTING.md

> **Status:** Active
> **Renderer:** react-markdown
> **Styles:** Tailwind Typography (prose)

---

## 🛡️ Deep Hardening & Resilience

To prevent **React Error #31** (Objects as children), MedCopy implements a mandatory stringification layer:

1. **API Flattening**: All non-array objects returned by the LLM are recursively cleaned.
2. **Smarter Flattening**: If an object contains keys like `title`, `post`, or `content`, it is merged into a clean Markdown block:
   ```markdown
   ## [Title]
   [Content]
   ```
3. **Recursive Guards**: The system ensures `carouselOutput`, `batchOutput`, and `multiFormatOutput` variants are valid strings.
4. **Frontend Fallback**: The `ensureString` helper in `App.tsx` provides a final rendering guard for all mapping loops.

### Handling Structured Mistakes
If the model hallucinates a dictionary instead of a paragraph:
- **Input**: `{ "intro": "Hello", "body": "World" }`
- **Output**: `**INTRO**: Hello\n\n**BODY**: World` (Fallback flattening)
- **Input (Smarter)**: `{ "title": "Welcome", "post": "Hello World" }`
- **Output**: `## Welcome\n\nHello World` (Refined flattening)

## 1. Overview
MedCopy AI Studio uses strict standardized formatting to ensure all generated content—whether from Text, Vision, or Summary modes—is clean, professional, and easy to read. Raw plain text is no longer used for display; instead, we render rich Markdown across all UI components.

## 2. Formatting Standards

### 2.1 Structure (Markdown)
The AI models (`gemma-3-27b-it`) are instructed to output strict Markdown.
*   **Headers:** Use `## Title` for section headers. (H1 is reserved for the page title).
*   **Emphasis:** Use `**Bold**` for key terms, medical findings, or calls to action.
*   **Lists:** Use `- Item` or `1. Item` for bullet points.
*   **Spacing:** Double line breaks between paragraphs for readability.

### 2.2 Mode-Specific Formatting
- **Standard Mode**: Full Markdown document.
- **Batch Mode**: Each variant is rendered as an independent `ReactMarkdown` card.
- **Carousel Mode**: Each slide (Title + Content) is rendered with rich Markdown support.
- **Multi-Format**: Platform-specific tabs render filtered content via the Markdown engine.

## 3. Technical Implementation

### 3.1 Frontend Renderer
We use `react-markdown` to parse the AI's response string into HTML elements. This is centralized in `App.tsx` using a shared `markdownComponents` configuration.

```tsx
<div className="prose prose-slate dark:prose-invert ...">
  <ReactMarkdown components={markdownComponents}>
    {ensureString(content)}
  </ReactMarkdown>
</div>
```

### 3.2 Styling (Premium Design Tokens)
Our custom `components` mapping in `ReactMarkdown` injects specific styles:
*   **Headings:** Large, bold `slate-900` text with a subtle `slate-200` underline.
*   **Lists:** Custom bullet points using `cyan-500` dots.
*   **Emphasis:** Highlights key text in `cyan-700` (Dark: `cyan-400`).
*   **Blockquotes:** Styled as "Medical Notes" with a `border-l-4 border-cyan-500`.

## 4. Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Visible `##` or `**` chars** | Missing `ReactMarkdown` wrapper. | Wrap output in `<ReactMarkdown components={markdownComponents}>`. |
| **Unstyled Text** | Missing `@tailwindcss/typography`. | Check `tailwind.config.js` plugins. |
| **Dark text on Dark Mode** | Missing `dark:prose-invert`. | Ensure parent div has the utility class. |
