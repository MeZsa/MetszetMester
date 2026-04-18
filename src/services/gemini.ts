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

export async function analyzeHistologyImage(base64Image: string, mimeType: string, language: string = 'hu'): Promise<HistologyAnalysisResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const langInstruction = language === 'en' 
    ? "IMPORTANT: You MUST respond entirely in English. Use standard English medical terminology."
    : "FONTOS: Válaszaidat kizárólag magyar nyelven add meg, a hazai orvosi terminológiát használva.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: language === 'en' ? "Please analyze this histology slide for educational purposes and identify the main structures with coordinates." : "Kérlek, elemezd ezt a szövettani metszetet oktatási céllal, és azonosítsd a főbb struktúrákat koordinátákkal." },
            { inlineData: { data: base64Image.split(',')[1], mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + langInstruction,
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

export async function generateHistologyQuiz(base64Image: string, mimeType: string, analysis: HistologyAnalysisResponse, language: string = 'hu'): Promise<HistologyQuizResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const quizPromptHu = `
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

  const quizPromptEn = `
    Create a multiple-choice quiz with 5 questions based on the attached histology image and the analysis below.
    
    Analysis:
    ${analysis.report}
    
    Annotations:
    ${JSON.stringify(analysis.annotations)}
    
    The goal of the quiz is to test students' deeper understanding.
    IMPORTANT: Do not just ask for identification! At least 60% of the questions should cover:
    1. **Functional correlations**: How does the structure serve its physiological purpose?
    2. **Clinical relevance**: What pathological conditions or symptoms can arise from damage to this tissue element?
    3. **Differential diagnosis**: What other histological appearances can it be confused with, and what is the difference?
    
    Provide 4 options for each question, indicate the correct answer, and provide a detailed professional explanation.
    If a question refers to a specific annotation, provide its index in the 'annotationRef' field.
  `;

  const quizPrompt = language === 'en' ? quizPromptEn : quizPromptHu;

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
        systemInstruction: language === 'en' 
          ? "You are a histology instructor. Create a professionally accurate, educational quiz in English." 
          : "Ön egy szövettan oktató. Készítsen szakmailag pontos, tanulságos kvízt magyar nyelven.",
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

export async function interpretMedicalReport(reportText: string, language: string = 'hu'): Promise<ReportInterpretationResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const instructionHu = `
  Ön egy oktatási célú orvosi leletértelmező asszisztens.
  NAGYON FONTOS SZABÁLYOK:
  ❗ nem ad diagnózist
  ❗ nem ad kezelési javaslatot
  ❗ kizárólag oktatási célt szolgál

  Fő fókusz: orvosi terminológia elmagyarázása.
  A felhasználó bemásol egy orvosi leletet. Az Ön feladata, hogy közérthetően elmagyarázza a benne szereplő orvosi szakszavakat, anatómiai fogalmakat és kifejezéseket.
  A 'disclaimer' mezőben mindig hangsúlyozza ki a fenti 3 szabályt.
  Kérlek, MAGYARUL válaszolj.
  `;

  const instructionEn = `
  You are an educational medical report interpreter assistant.
  VERY IMPORTANT RULES:
  ❗ you do not provide diagnoses
  ❗ you do not provide treatment advice
  ❗ this is strictly for educational purposes

  Main focus: explaining medical terminology.
  The user pastes a medical report. Your task is to explain the medical terms, anatomical concepts, and phrases clearly.
  In the 'disclaimer' field, always emphasize the 3 rules above.
  Please answer in ENGLISH.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: reportText }] }],
      config: {
        systemInstruction: language === 'en' ? instructionEn : instructionHu,
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

export async function interpretMedicalReportFromFile(base64Data: string, mimeType: string, language: string = 'hu'): Promise<ReportInterpretationResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const instructionHu = `
  Ön egy oktatási célú orvosi leletértelmező asszisztens.
  NAGYON FONTOS SZABÁLYOK:
  ❗ nem ad diagnózist
  ❗ nem ad kezelési javaslatot
  ❗ kizárólag oktatási célt szolgál

  Fő fókusz: orvosi terminológia elmagyarázása.
  A felhasználó feltöltött egy orvosi leletet (kép vagy PDF formátumban). Az Ön feladata, hogy közérthetően elmagyarázza a benne szereplő orvosi szakszavakat, anatómiai fogalmakat és kifejezéseket.
  A 'disclaimer' mezőben mindig hangsúlyozza ki a fenti 3 szabályt.
  Kérlek, MAGYARUL válaszolj.
  `;

  const instructionEn = `
  You are an educational medical report interpreter assistant.
  VERY IMPORTANT RULES:
  ❗ you do not provide diagnoses
  ❗ you do not provide treatment advice
  ❗ this is strictly for educational purposes

  Main focus: explaining medical terminology.
  The user uploaded a medical report (image or PDF). Your task is to explain the medical terms, anatomical concepts, and phrases clearly.
  In the 'disclaimer' field, always emphasize the 3 rules above.
  Please answer in ENGLISH.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: language === 'en' ? "Please interpret the attached medical report." : "Kérem, értelmezze a mellékelt orvosi leletet." },
            { inlineData: { data: base64Data.split(',')[1], mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: language === 'en' ? instructionEn : instructionHu,
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
