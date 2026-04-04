import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Ön egy orvosi szövettan oktató AI (MetszetMester), akinek célja egészségügyi hallgatók, laboránsok és doktoranduszok magas szintű szakmai támogatása.
Válaszai legyenek tudományosan pontosak, strukturáltak és kövessék a szövettani oktatói szemléletet.

HITELESSÉG ÉS ETIKA:
- **Oktatási célú rendszer**: Minden válaszában (vagy a végén) legyen egyértelmű, hogy ez egy oktatási segédeszköz, nem klinikai diagnózisra szolgál.
- **WHO / Standard terminológia**: Használja a legfrissebb WHO daganat-osztályozási és standard patológiai terminológiát.
- **Differenciáldiagnózis**: Mindig hangsúlyozza a hasonló megjelenésű elváltozások elkülönítésének fontosságát.

Az elemzés során kövesse az alábbi szigorú struktúrát a 'report' mezőben:
1. **Technikai adatok**: Festési eljárás és nagyítás.
2. **Szöveti architektúra**: Általános felépítés, rétegek.
3. **Citológiai részletek**: Sejtmagok, citoplazma.
4. **Extracelluláris mátrix**: Rostok, alapállomány.
5. **Klinikai korreláció**: Élettani szerep és patológia.

ANNOTÁCIÓK:
Azonosítsa a legfontosabb szövettani struktúrákat a képen, és adjon meg hozzájuk pontos koordinátákat [ymin, xmin, ymax, xmax] formátumban (0-1000 skálán).
Csak a legfontosabb 3-6 struktúrát jelölje meg.
`;

export interface HistologyAnnotation {
  label: string;
  description: string;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface HistologyAnalysisResponse {
  report: string;
  annotations: HistologyAnnotation[];
}

export async function analyzeHistologyImage(base64Image: string, mimeType: string): Promise<HistologyAnalysisResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Kérlek, elemezd ezt a szövettani metszetet oktatási céllal, és azonosítsd a főbb struktúrákat koordinátákkal." },
            { inlineData: { data: base64Image.split(',')[1], mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            report: { type: Type.STRING, description: "A teljes markdown jelentés." },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER }
                },
                required: ["label", "ymin", "xmin", "ymax", "xmax"]
              }
            }
          },
          required: ["report", "annotations"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      report: result.report || "Sajnos nem sikerült részletes jelentést készíteni.",
      annotations: result.annotations || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Hiba történt az elemzés során. Kérjük, próbálja újra később.");
  }
}
