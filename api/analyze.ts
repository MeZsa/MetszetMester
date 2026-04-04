import { analyzeHistologyImage } from "../src/gemini";

export default async function handler(req, res) {
  try {
    const { image, mimeType } = req.body;
    const result = await analyzeHistologyImage(image, mimeType);
    res.status(200).json(result);
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
