# VISION.md - MedCopy Vision System Guide

> **Feature Status:** Active (v2.4)
> **Model:** gemma-3-27b-it (Native 896px Resolution)

---

## 1. Overview

The **MedCopy Vision System** allows users to upload medical images (X-rays, MRIs, clinical photos, charts, graphs) and receive detailed, persona-driven analysis. It leverages the multimodal capabilities of the **gemma-3-27b-it** model to "see" and interpret visual data alongside textual context.

## 2. How to Use

1.  **Activate Vision Mode**:
    *   Click the **Vision Mode** toggle in the control panel.
    *   *Note:* This automatically disables Batch, Carousel, and Summarizer modes.

2.  **Upload Image**:
    *   **Drag & Drop**: Drag an image file into the designated upload area.
    *   **Click to Upload**: Click the upload box to select a file from your device.
    *   **Supported Formats**: JPEG, PNG, WEBP, HEIC (browser dependent).

3.  **Refine Context**:
    *   **Persona**: Select the expert voice (e.g., "Academic Cardiologist", "Empathetic GP").
    *   **Specific Question**: Use the "Specific Question / Focus" text area to guide the analysis (e.g., "Describe the fracture pattern," "Summarize the trend in this graph").

4.  **Generate**:
    *   Click the **Analyze Image** button.
    *   The system will process the image and generate a response in the selected persona's voice.

## 3. Technical Implementation

### Frontend (`App.tsx`)
*   **State Management**: `imageMode` (boolean) and `image` (base64 string) added to `GenerationInputs`.
*   **File Handling**: Uses `FileReader` to convert uploaded files to Base64 strings.
*   **UI**: Dedicated conditional rendering block for the image upload interface.

### Backend Logic (`services/geminiService.ts`)
*   **Multimodal Prompting**:
    *   Constructs a specialized `visionPrompt` that instructs the model to act as a medical image analyst.
    *   Injects the `content` array with two parts:
        1.  `text`: The system instructions + vision prompt.
        2.  `inlineData`: The Base64 encoded image data and MIME type.
*   **Performance Optimization**:
    *   **Client-Side Resizing**: Automatically resizes images to **512x512** (Ultra-Fast Mode) to maximize performance and prevent timeouts.
    *   **Extended Timeout**: Configured with a 300-second (5-minute) timeout.
*   **Smart Retry System**:
    *   Automatically detects **503 Service Unavailable** and **Deadline Exceeded** errors.
    *   **Exponential Backoff**: Pauses (2s, 4s, 8s...) between retries to prevent API overload.
*   **Model Configuration**:
    *   **Primary**: `gemma-3-27b-it` (High fidelity, multimodal).
    *   **Fallback**: None. (User enforced strict model adherence).

## 4. Privacy & Security

*   **Client-Side Processing**: Images are converted to Base64 within the browser.
*   **Transient Storage**: Images are held in the browser's memory only for the duration of the session or until cleared.
*   **API Transmission**: Image data is sent directly to Google's GenAI API via a secure HTTPS request. **No intermediate server stores your images.**

## 5. Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **"Please upload an image..."** | No image selected while in Vision Mode. | Upload an image before clicking Generate. |
| **Generation Fails / Error** | Image too large or unsupported format. | Try a smaller image (under 4MB) or convert to JPEG/PNG. |
| **Timeout (503 Error)** | Transient Google API overload. | **System Auto-Retry Active.** The app will automatically retry with a different API key. |
| **Inaccurate Analysis** | Low image resolution or vague prompt. | Use a clearer image and provide a specific question in the prompt. |
| **Model Hallucination** | Ambiguous image content. | The AI may guess if details are unclear. Always verify with a human expert. |

---

> **Disclaimer:** MedCopy Vision is an assistive tool for educational and drafting purposes. **It is NOT a diagnostic device.** Always verify findings with a qualified medical professional.
