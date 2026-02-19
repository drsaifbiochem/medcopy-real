/**
 * Redacts sensitive information (API keys, tokens, URLs) from objects before logging.
 */
export function sanitizeError(error: any): any {
    if (!error) return error;

    try {
        // Clone the error to avoid mutating the original
        // Use Object.getOwnPropertyNames to capture non-enumerable properties like 'message' and 'stack'
        const sanitized = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

        const sensitivePatterns = [
            /AIzaSy[A-Za-z0-9_-]{35}/g, // Gemini API Key
            /[a-zA-Z0-9]{32}/g,          // Generic 32-char keys
            /https:\/\/[\w.-]+\/v1/g    // API URLs
        ];

        const redact = (obj: any): any => {
            if (typeof obj === 'string') {
                let result = obj;
                sensitivePatterns.forEach(pattern => {
                    result = result.replace(pattern, '[REDACTED]');
                });
                return result;
            }
            if (typeof obj === 'object' && obj !== null) {
                // Handle arrays
                if (Array.isArray(obj)) {
                    return obj.map(redact);
                }
                // Handle objects
                const newObj: any = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        newObj[key] = redact(obj[key]);
                    }
                }
                return newObj;
            }
            return obj;
        };

        return redact(sanitized);
    } catch (e) {
        return "[Sanitization Failed: Possible circular reference or complex object]";
    }
}
