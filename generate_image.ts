import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A classic histological section with H&E (hematoxylin and eosin) staining, medium-high magnification. Topic: simple squamous epithelium. Showing a single layer of flat cells, flattened/elongated nuclei, thin epithelial layer with underlying connective tissue. No labels, no text, no stylized/artistic representation, no diagrams, no schematics, no stratified epithelium. Educational purpose for tissue recognition.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        fs.writeFileSync('public/simple_squamous_epithelium.png', Buffer.from(base64EncodeString, 'base64'));
        console.log('Image saved to public/simple_squamous_epithelium.png');
      }
    }
  } catch (e) {
    console.error(e);
  }
}

main();
