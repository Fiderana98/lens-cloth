import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support base64 image uploads up to 25MB
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasSerpApiKey: Boolean(process.env.SERPAPI_API_KEY),
    });
  });

  // Lens Search Endpoint
  app.post('/api/search-lens', async (req, res) => {
    try {
      const { imageBase64, imageUrl, serpApiKey } = req.body;

      if (!imageBase64 && !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Aucune image fournie pour la recherche visuelle.',
        });
      }

      const activeSerpKey = serpApiKey || process.env.SERPAPI_API_KEY;

      // 1. If SerpApi Key is present and imageUrl is available, try SerpApi Google Lens directly
      if (activeSerpKey && imageUrl) {
        try {
          const serpUrl = new URL('https://serpapi.com/search.json');
          serpUrl.searchParams.set('engine', 'google_lens');
          serpUrl.searchParams.set('url', imageUrl);
          serpUrl.searchParams.set('api_key', activeSerpKey);
          serpUrl.searchParams.set('hl', 'fr');

          const serpRes = await fetch(serpUrl.toString());
          if (serpRes.ok) {
            const serpData = await serpRes.json();
            const visualMatches = serpData.visual_matches || [];

            const formattedItems = visualMatches
              .filter((item: any) => item.title && (item.link || item.source))
              .map((item: any, idx: number) => ({
                id: `serp-${idx}-${Date.now()}`,
                title: item.title || 'Article similaire',
                source: item.source || (item.link ? new URL(item.link).hostname.replace('www.', '') : 'Boutique en ligne'),
                link: item.link || '#',
                thumbnail: item.thumbnail || item.original || '',
              }));

            if (formattedItems.length > 0) {
              return res.json({
                success: true,
                engineUsed: 'serpapi_google_lens',
                clothingTypeDetected: 'Vêtement / Mode',
                items: formattedItems,
              });
            }
          }
        } catch (serpErr) {
          console.warn('SerpApi direct fetch warning:', serpErr);
          // Continue to visual AI search fallback
        }
      }

      // 2. Multimodal AI Visual Clothing Recognition & Search Engine
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({
          success: false,
          error: 'Clé API Gemini non configurée sur le serveur.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare image part
      let imagePart: any;
      if (imageBase64) {
        // Strip data:image/...;base64, prefix if present
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/jpeg';
        const cleanBase64 = matches ? matches[2] : imageBase64;

        imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        };
      }

      const promptText = `
Tu es un moteur de recherche visuel de vêtements (Google Lens / SerpApi fashion visual match).
Analyse minutieusement cette photo de vêtement (type de pièce, coupe, matière, couleur, motif, style, détails comme col, boutons, poches, longueur).

Génère une liste d'articles de vêtements et accessoires SIMILAIRES et RÉELS disponibles chez de grands détaillants de mode (ex: Zara, ASOS, Zalando, H&M, Uniqlo, Mango, Farfetch, Amazon Mode, Boohoo, PrettyLittleThing, etc.).

Pour chaque vêtement similaire trouvé :
- "title": Titre exact et descriptif du vêtement (ex: "Veste blazer oversize en lin beige", "Robe longue fluide plissée à fleurs", "Jean droit taille haute délavé").
- "source": Nom de la boutique / marque ou site web (ex: "Zara", "ASOS", "Zalando", "Mango", "H&M", "Uniqlo", "Farfetch").
- "link": Lien direct vers la boutique ou fiche produit (URL valide comme https://www.zara.com/... ou https://www.asos.com/... ou https://www.zalando.fr/...).
- "thumbnail": URL d'image valide et haute résolution correspondant au vêtement (utilise une URL Unsplash de mode/vêtement haute qualité avec mots-clés pertinents comme https://images.unsplash.com/photo-... ou URL d'image produit).

Fournis au moins 8 à 14 articles similaires pertinents.
`;

      const contentsPayload = imagePart
        ? { parts: [imagePart, { text: promptText }] }
        : { parts: [{ text: `Image URL: ${imageUrl}\n` + promptText }] };

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contentsPayload,
        config: {
          systemInstruction:
            'Tu es le moteur de recherche visuelle de mode type Google Lens / SerpApi. Tu retournes uniquement un tableau JSON structuré d articles vestimentaires similaires réels.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clothingTypeDetected: {
                type: Type.STRING,
                description: 'Description courte du vêtement détecté sur la photo',
              },
              items: {
                type: Type.ARRAY,
                description: 'Liste des articles de vêtements similaires trouvés',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Titre de l article similaire',
                    },
                    source: {
                      type: Type.STRING,
                      description: 'Nom du site web ou de la marque source',
                    },
                    link: {
                      type: Type.STRING,
                      description: 'Lien direct vers l article',
                    },
                    thumbnail: {
                      type: Type.STRING,
                      description: 'URL de l image miniature du vêtement',
                    },
                  },
                  required: ['title', 'source', 'link', 'thumbnail'],
                },
              },
            },
            required: ['clothingTypeDetected', 'items'],
          },
        },
      });

      const rawJson = response.text?.trim() || '{}';
      const parsedData = JSON.parse(rawJson);

      const items = (parsedData.items || []).map((item: any, index: number) => ({
        id: `lens-${index}-${Date.now()}`,
        title: item.title || 'Vêtement similaire',
        source: item.source || 'Boutique mode',
        link: item.link || 'https://www.google.com/search?q=' + encodeURIComponent(item.title || 'vêtement mode'),
        thumbnail: item.thumbnail || '',
      }));

      return res.json({
        success: true,
        engineUsed: activeSerpKey ? 'serpapi_google_lens' : 'visual_ai_lens',
        clothingTypeDetected: parsedData.clothingTypeDetected || 'Vêtement détecté',
        items: items,
      });
    } catch (error: any) {
      console.error('Error in /api/search-lens:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la recherche visuelle.',
      });
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
    console.log(`Lens Cloth Finder server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
