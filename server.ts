import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  
  // Groq & Gemini AI proxy endpoint
  app.post('/api/ai', async (req, res) => {
    try {
      const { prompt, image, history } = req.body;
      if (!prompt && !image) {
        return res.status(400).json({ error: 'Prompt or image is required' });
      }

      // Truncate prompt string locally to guarantee we do not exceed token ceilings (approx. 2000 tokens limit)
      const safePrompt = prompt && typeof prompt === 'string' && prompt.length > 8000 ? prompt.substring(0, 8000) + "\n[Content truncated for length constraints...]" : (prompt || "");

      // 1. Prefer Gemini API if GEMINI_API_KEY is available
      if (process.env.GEMINI_API_KEY) {
        console.log(`Using Gemini API (gemini-3.1-pro-preview) to generate content. Has image: ${!!image}`);
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          let contents: any[] = [];
          
          let response;
          const tryGenerate = async (modelName: string) => {
            let localContents: any[] = [];
            if (history && Array.isArray(history)) {
              for (const msg of history) {
                localContents.push({
                  role: msg.role === 'model' ? 'model' : 'user',
                  parts: [{ text: msg.parts?.[0]?.text || '' }]
                });
              }
            }
            if (image) {
              let base64Data = image;
              let mimeType = "image/png";
              if (image.includes(';base64,')) {
                const parts = image.split(';base64,');
                mimeType = parts[0].replace('data:', '');
                base64Data = parts[1];
              }

              const imagePart = {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              };
              const textPart = {
                text: safePrompt || "Please analyze this image.",
              };

              localContents.push({ role: 'user', parts: [imagePart, textPart] });
            } else {
              if (safePrompt) {
                localContents.push({ role: 'user', parts: [{ text: safePrompt }] });
              }
            }

            return await ai.models.generateContent({
              model: modelName,
              contents: localContents,
              config: {
                systemInstruction: "You are an advanced, elite AI assistant. Provide highly accurate, precise, and logically rigorous answers to the user's questions. Strive for 99% accuracy. Avoid hallucinations. Format beautifully with markdown formatting.",
              },
            });
          };

          try {
            console.log("Attempting to use advanced model gemini-3.1-pro-preview...");
            response = await tryGenerate("gemini-3.1-pro-preview");
          } catch (firstErr: any) {
            console.warn("Generating with gemini-3.1-pro-preview failed (possibly needs subscription/paid model flow), falling back to free-tier gemini-3.5-flash:", firstErr.message || firstErr);
            response = await tryGenerate("gemini-3.5-flash");
          }

          const text = response.text || '';
          return res.json({ text });
        } catch (geminiErr: any) {
          console.error("Gemini API error, falling back if possible:", geminiErr);
          // If Gemini fails, we fall back to Groq/Llama below rather than crashing
        }
      }

      // 2. Fallback to Groq / Llama (or if image is set and Gemini is unavailable, we can use Groq's vision model or default text model)
      console.log(`Using Groq API to generate content. Has image: ${!!image}`);
      
      let groqMessages = [
        {
          role: 'system',
          content: "You are an advanced, elite AI assistant. Provide highly detailed and accurate answers to the user's questions in structured markdown. Strive for 99% accuracy."
        }
      ];
      
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          groqMessages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
          });
        });
      }

      if (image) {
        let base64Data = image;
        let mimeType = "image/png";
        if (image.includes(';base64,')) {
          const parts = image.split(';base64,');
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }

        try {
          const visionMessages = [...groqMessages, {
            role: 'user',
            content: [
              { type: 'text', text: safePrompt || "Analyze this image." },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ] as any
          }];

          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: 'llama-3.2-11b-vision-preview',
              messages: visionMessages,
              temperature: 0.5,
              max_tokens: 1536
            })
          });

          if (groqResponse.ok) {
            const data = await groqResponse.json();
            const text = data.choices?.[0]?.message?.content || '';
            return res.json({ text });
          } else {
            const errorText = await groqResponse.text();
            console.warn("Groq vision model failed:", errorText);
          }
        } catch (groqVidErr) {
          console.error("Groq vision call error:", groqVidErr);
        }
      }

      // Standard text-only fallback logic
      const primaryModel = 'llama-3.3-70b-versatile';
      
      if (safePrompt) {
         groqMessages.push({ role: 'user', content: safePrompt });
      }

      const makeGroqCall = async (modelName: string) => {
        return await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: groqMessages,
            temperature: 0.5,
            max_tokens: 1536
          })
        });
      };

      let groqResponse = await makeGroqCall(primaryModel);

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.warn(`Primary model ${primaryModel} failed. Falling back to llama-3.1-8b-instant...`);
        groqResponse = await makeGroqCall('llama-3.1-8b-instant');
      }

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API returned status ${groqResponse.status}: ${errorText}`);
      }

      const data = await groqResponse.json();
      const text = data.choices?.[0]?.message?.content || '';
      res.json({ text });
    } catch (err: any) {
      console.error('AI Proxy Error:', err);
      res.status(500).json({ error: err.message || 'AI generation failed' });
    }
  });

  app.get('/api/routine', async (req, res) => {
    try {
      const { sheet_ID, sheetName } = req.query;
      if (!sheet_ID || !sheetName) {
        return res.status(400).json({ error: 'Missing parameters' });
      }
      const url = `https://docs.google.com/spreadsheets/d/${sheet_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheets returned ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      res.send(text);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Failed to fetch routine' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
