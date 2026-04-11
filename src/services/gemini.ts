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

KLINIKAI GONDOLKODÁS MODUL:
Adjon meg maximum 5 lehetséges klinikai okot/differenciáldiagnózist a látott kép alapján.
- A "nev" mezőben általánosan elfogadott orvosi megnevezés legyen.
- A "rovid_magyarazat" legyen tömör (1-2 mondat).
- A "patofiziologia" magyarázza el, miért alakulnak ki a tünetek/elváltozások.
- A "kulonbseg" mező mutassa be, miben tér el más lehetőségektől.
- A "gondolkodasi_lepes" mező röviden írja le, hogyan szűkítette a lehetőségeket a látott szövettani kép alapján.

STÍLUS: Tömör, szakmai, oktató jellegű, felesleges szöveg nélkül.

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

export interface ClinicalCause {
  nev: string;
  rovid_magyarazat: string;
  patofiziologia: string;
  kulonbseg: string;
  gondolkodasi_lepes: string;
}

export interface HistologyAnalysisResponse {
  report: string;
  annotations: HistologyAnnotation[];
  clinicalCauses: ClinicalCause[];
}

export interface HistologyQuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  annotationRef?: number; // Index of the annotation this question refers to, if any
}

export interface HistologyQuizResponse {
  questions: HistologyQuizQuestion[];
}

export interface ReportTerm {
  term: string;
  explanation: string;
}

export interface ReportInterpretationResponse {
  summary: string;
  terms: ReportTerm[];
  disclaimer: string;
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
            },
            clinicalCauses: {
              type: Type.ARRAY,
              description: "Maximum 5 lehetséges klinikai ok.",
              items: {
                type: Type.OBJECT,
                properties: {
                  nev: { type: Type.STRING },
                  rovid_magyarazat: { type: Type.STRING },
                  patofiziologia: { type: Type.STRING },
                  kulonbseg: { type: Type.STRING },
                  gondolkodasi_lepes: { type: Type.STRING }
                },
                required: ["nev", "rovid_magyarazat", "patofiziologia", "kulonbseg", "gondolkodasi_lepes"]
              }
            }
          },
          required: ["report", "annotations", "clinicalCauses"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      report: result.report || "Sajnos nem sikerült részletes jelentést készíteni.",
      annotations: result.annotations || [],
      clinicalCauses: result.clinicalCauses || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Hiba történt az elemzés során. Kérjük, próbálja újra később.");
  }
}

export async function generateHistologyQuiz(base64Image: string, mimeType: string, analysis: HistologyAnalysisResponse): Promise<HistologyQuizResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const quizPrompt = `
    Készíts egy 5 kérdésből álló feleletválasztós kvízt a mellékelt szövettani kép és az alábbi elemzés alapján.
    
    Elemzés:
    ${analysis.report}
    
    Annotációk:
    ${JSON.stringify(analysis.annotations)}
    
    A kvíz célja a hallgatók mélyebb megértésének tesztelése. 
    FONTOS: Ne csak azonosításra kérdezz rá! A kérdések legalább 60%-a vonatkozzon a következőkre:
    1. **Funkcionális összefüggések**: Hogyan szolgálja az adott struktúra felépítése annak élettani feladatát?
    2. **Klinikai relevanciák**: Milyen kóros állapotokhoz vagy tünetekhez vezethet az adott szöveti elem károsodása?
    3. **Differenciáldiagnosztika**: Milyen más szövettani képpel téveszthető össze, és mi a különbség?
    
    Minden kérdéshez adj 4 opciót, jelöld meg a helyes választ, és adj egy részletes szakmai magyarázatot.
    Ha egy kérdés egy konkrét annotációra vonatkozik, add meg annak az indexét az 'annotationRef' mezőben.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: quizPrompt },
            { inlineData: { data: base64Image.split(',')[1], mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: "Ön egy szövettan oktató. Készítsen szakmailag pontos, tanulságos kvízt.",
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                  annotationRef: { type: Type.NUMBER }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      questions: result.questions || []
    };
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    throw new Error("Hiba történt a kvíz generálása során.");
  }
}

export async function interpretMedicalReport(reportText: string): Promise<ReportInterpretationResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const instruction = `
  Ön egy oktatási célú orvosi leletértelmező asszisztens.
  NAGYON FONTOS SZABÁLYOK:
  ❗ nem ad diagnózist
  ❗ nem ad kezelési javaslatot
  ❗ kizárólag oktatási célt szolgál

  Fő fókusz: orvosi terminológia elmagyarázása.
  A felhasználó bemásol egy orvosi leletet. Az Ön feladata, hogy közérthetően elmagyarázza a benne szereplő orvosi szakszavakat, anatómiai fogalmakat és kifejezéseket.
  A 'disclaimer' mezőben mindig hangsúlyozza ki a fenti 3 szabályt.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: reportText }] }],
      config: {
        systemInstruction: instruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A lelet tartalmának nagyon rövid, 1-2 mondatos, laikusok számára is érthető általános összefoglalója (diagnózis nélkül)." },
            terms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: "Az orvosi szakszó vagy kifejezés." },
                  explanation: { type: Type.STRING, description: "Közérthető magyarázat." }
                },
                required: ["term", "explanation"]
              }
            },
            disclaimer: { type: Type.STRING, description: "Kötelező figyelmeztetés, hogy ez nem diagnózis, nem kezelési javaslat, csak oktatási célú." }
          },
          required: ["summary", "terms", "disclaimer"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Report Interpreter Error:", error);
    throw new Error("Hiba történt a lelet értelmezése során.");
  }
}
