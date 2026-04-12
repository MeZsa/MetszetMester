import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const topics = [
  { id: 'egyretegu_hamok', prompt: 'Téma: Egyrétegű hámok (Simple epithelium).' },
  { id: 'tobbretegu_hamok', prompt: 'Téma: Többrétegű hámok (Stratified epithelium).' },
  { id: 'mirigyhamok', prompt: 'Téma: Mirigyhámok és speciális formák (Glandular epithelium, pseudostratified).' },
  { id: 'kotoszovet', prompt: 'Téma: Kötőszövetek (Connective tissue).' },
  { id: 'zsirszovet', prompt: 'Téma: Zsírszövet (Adipose tissue).' },
  { id: 'porcszovet', prompt: 'Téma: Porcszövet (Cartilage).' },
  { id: 'csontszovet', prompt: 'Téma: Csontszövet (Bone tissue).' },
  { id: 'izomszovet', prompt: 'Téma: Izomszövetek (Skeletal, cardiac, or smooth muscle tissue).' },
  { id: 'idegszovet', prompt: 'Téma: Idegszövet (Nervous tissue, neurons, glia).' }
];

const basePrompt = `Oktatási célú hisztológiai kép generálása.
A kép klasszikus hisztológiai metszetet ábrázoljon H&E festéssel,
közepes nagyításon, tanulási és felismerési célra.
A hangsúly a szövettani struktúra vizuális megfigyelésén legyen.
Ne tartalmazzon feliratokat, nyilakat, annotációkat vagy diagnosztikai értelmezést.
A kép alkalmas legyen a struktúrák készségszintű felismerésének gyakorlására.`;

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  for (const topic of topics) {
    console.log("Generating image for " + topic.id + "...");
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: basePrompt + "\n\n" + topic.prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const ext = part.inlineData.mimeType === 'image/jpeg' ? 'jpg' : 'png';
          const filePath = path.join('src/assets', topic.id + '.' + ext);
          fs.writeFileSync(filePath, Buffer.from(base64EncodeString, 'base64'));
          console.log("Saved " + filePath);
        }
      }
    } catch (e) {
      console.error("Failed to generate for " + topic.id + ":", e);
    }
    // Wait a bit to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main();
