require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

async function extractTextFromPDF(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

app.post('/screen', upload.fields([{ name: 'resumes' }, { name: 'jd' }]), async (req, res) => {
  try {
    const jdText = await extractTextFromPDF(req.files['jd'][0].buffer);

    const resumeFiles = req.files['resumes'];
    const resumeTexts = await Promise.all(
      resumeFiles.map(async (file) => {
        const text = await extractTextFromPDF(file.buffer);
        return { name: file.originalname, text };
      })
    );

    const resumeBlock = resumeTexts.map((r, i) =>
      `Resume ${i + 1} (${r.name}):\n${r.text}`
    ).join('\n\n---\n\n');

    const prompt = `
You are an expert HR assistant. Score each resume from 0-100 based on how well it matches the Job Description.
Give a brief reason (2-3 lines) for each score.

Job Description:
${jdText}

Resumes:
${resumeBlock}

Respond ONLY in this JSON format with no extra text:
[
  {
    "name": "filename",
    "score": 85,
    "reason": "Brief reason here"
  }
]
`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const results = JSON.parse(jsonMatch[0]);
    const sorted = results.sort((a, b) => b.score - a.score);

    res.json({ success: true, results: sorted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});