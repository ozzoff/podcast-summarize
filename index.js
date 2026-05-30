const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Fetch Transcript ────────────────────────────────────────
app.get('/transcript', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  try {
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
      headers: { 'x-api-key': process.env.SUPADATA_API_KEY }
    });
    const data = await response.json();
    if (!response.ok || !data.content) {
      return res.status(404).json({ error: 'Could not fetch transcript.' });
    }
    res.json({ transcript: data.content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript: ' + err.message });
  }
});

// ── Summarize ───────────────────────────────────────────────
app.post('/summarize', async (req, res) => {
  const { transcript, videoUrl, promptTemplate } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript is required' });

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = promptTemplate
      .replace('{{transcript}}', transcript)
      .replace('[YouTube URL]', videoUrl)
      .replace("[Today's date]", today);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Gemini API error');
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ summary });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'Podcast backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
