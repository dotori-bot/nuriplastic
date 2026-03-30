import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.post("/api/generate-image", async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set." });
    }

    const { capType, bodyShape, styleNote } = req.body ?? {};
    if (!capType || !bodyShape) {
      return res.status(400).json({ error: "capType and bodyShape are required." });
    }

    const prompt = [
      "Cosmetic container product photo.",
      `Cap type: ${capType}.`,
      `Body shape: ${bodyShape}.`,
      "White studio background, soft shadow, front angle, realistic lighting.",
      "Transparent container material, no brand logo, no text label.",
      styleNote ? `Additional style: ${styleNote}` : ""
    ].join(" ");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
