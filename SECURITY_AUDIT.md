# Security Audit Report (v2.5)

This audit was conducted using the `@security-auditor` skill to identify vulnerabilities and data leaks in the MedCopy platform.

## Summary of Findings

| ID | Vulnerability | Severity | Status |
|---|---|---|---|
| **SA-001** | API Keys Exposed in Client Bundle | 🔴 **Critical** | Identified |
| **SA-002** | High-Severity Dependency Vulnerabilities | 🟠 **High** | Identified |
| **SA-003** | Potential OAuth Token Exposure | 🟡 **Medium** | Identified |
| **SA-004** | Potential Secret Leak in Logs | 🟢 **Low** | Redaction Planned |

---

## 🔴 SA-001: API Keys Exposed in Client Bundle

### Description
The application uses the Vite `define` feature to inject Gemini and Mistral API keys directly into the frontend bundle. Because this is a standard client-side build, any user can inspect the JavaScript source code and extract these keys.

### Impact
- **Financial**: Malicious actors could use your keys to run their own models, exhausting your credits or incurring high costs.
- **Quota**: Your generation limits could be exhausted by unauthorized traffic.

### Remediation (Immediate)
- **Restrict Keys**: Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and [Mistral Dashboard](https://console.mistral.ai/) and restrict your API keys to specific **Referrer Domains** (e.g., your production URL).

### Remediation (Permanent)
#### [REMEDIATED] [V2.5.1] Backend Proxy Implementation
- **Status**: ✅ FIXED (Implemented Feb 19, 2026)
- **Description**: All AI generation and Google Sheets logic has been moved to a Node.js server (`server.js`).
- **Impact**: API keys and Spreadsheet IDs are no longer bundled into the frontend. The frontend now communicates with the AI models via a secure server-side proxy.
- **Verification**: Verified via `npm run build` and internal proxy testing.

---

## 🟠 SA-002: Dependency Vulnerabilities

### Description
The following vulnerable packages were identified via `npm audit`:
- `minimatch <10.2.1`: Regular Expression Denial of Service (ReDoS) vulnerability.
- `gaxios >=7.1.3`: Security issues in the underlying HTTP client.

### Impact
Potential for denial-of-service or injection attacks depending on how these libraries process untrusted input.

### Remediation
- Manually override these dependencies in `package.json` using the `overrides` field (npm 8+).

---

## 🟡 SA-003: OAuth Token Handling

### Description
Google Sheets integration uses OAuth 2.0. The `accessToken` is stored as a global variable in `sheetService.ts`.

### Impact
While relatively safe in a single-page app, if an XSS vulnerability exists elsewhere, an attacker could steal the session token.

### Remediation
- Scope the token usage tightly.
- Ensure all inputs are sanitized to prevent XSS.

---

## 🟢 SA-004: Secret Leak in Logs

### Description
Standard error logging might accidentally include the API key or raw prompt context in the console output.

### Remediation
- **[REMEDIATED] [V2.5.1] Redaction Utility**
- **Status**: ✅ FIXED (Implemented Feb 19, 2026)
- **Description**: Added `sanitizeError` utility and `logRedaction` patterns to `api/` and `server.js`.
- **Functionality**: Automatically redacts patterns matching `AIza...` and other credential fingerprints before they are logged to stdout or the Vercel console.
