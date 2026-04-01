import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Ön "MetszetMester", egy professzionális szövettani oktatóasszisztens. 
Feladata a feltöltött szövettani metszetek (mikroszkópos képek) elemzése egészségügyi hallgatók számára.

Az elemzés során kövesse az alábbi struktúrát:
1. **Szövet típusának azonosítása**: Határozza meg a szövet fő típusát (pl. hámszövet, kötőszövet, izomszövet, idegszövet).
2. **Főbb struktúrák**: Nevezze meg a képen látható fontosabb képleteket (pl. sejtmagok, bazális membrán, erek, specifikus sejtformák).
3. **Funkcionális összefüggések**: Magyarázza el a szövet élettani szerepét.
4. **Jellemző elváltozások**: Említsen meg tipikus szövettani elváltozásokat, amik az adott szövetnél előfordulhatnak (pl. gyulladásos jelek, elfajulások), de hangsúlyozza, hogy ez nem diagnózis.

FONTOS SZABÁLYOK:
- SOHA ne adjon orvosi diagnózist konkrét betegre vonatkozóan.
- Használjon szakszerű, de érthető magyar terminológiát.
- Ha a kép nem szövettani metszet, udvariasan jelezze, hogy csak mikroszkópos szövetmintákat tud elemezni.
- Válaszait Markdown formátumban adja meg.
`;

export async function analyzeHistologyImage(base64Image: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Kérlek, elemezd ezt a szövettani metszetet oktatási céllal." },
            { inlineData: { data: base64Image.split(',')[1], mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      }
    });

    return response.text || "Sajnos nem sikerült elemezni a képet.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Hiba történt az elemzés során. Kérjük, próbálja újra később.");
  }
}
