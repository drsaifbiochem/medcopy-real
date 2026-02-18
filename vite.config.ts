import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2),
      'process.env.GEMINI_API_KEY_3': JSON.stringify(env.GEMINI_API_KEY_3),
      'process.env.GEMINI_API_KEY_4': JSON.stringify(env.GEMINI_API_KEY_4),
      'process.env.GEMINI_API_KEY_5': JSON.stringify(env.GEMINI_API_KEY_5),
      'process.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
      'process.env.MISTRAL_API_KEY_2': JSON.stringify(env.MISTRAL_API_KEY_2),
      'process.env.MISTRAL_API_KEY_3': JSON.stringify(env.MISTRAL_API_KEY_3),
      'process.env.MISTRAL_API_KEY_4': JSON.stringify(env.MISTRAL_API_KEY_4),
      'process.env.MISTRAL_API_KEY_5': JSON.stringify(env.MISTRAL_API_KEY_5),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_SPREADSHEET_ID': JSON.stringify(env.GOOGLE_SPREADSHEET_ID),
      'process.env.GOOGLE_APPS_SCRIPT_URL': JSON.stringify(env.GOOGLE_APPS_SCRIPT_URL)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
