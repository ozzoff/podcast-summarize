const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/transcript', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  try {
    // Fetch YouTube page
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const html = await pageRes.text();

    // Extract caption tracks
    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (!match) return res.status(404).json({ error: 'No captions found for this video.' });

    const tracks = JSON.parse(match[1]);
    const enTrack = tracks.find(t => t.languageCode === 'en') ||
                    tracks.find(t => t.languageCode?.startsWith('en')) ||
                    tracks[0];

    if (!enTrack?.baseUrl) return res.status(404).json({ error: 'No usable caption track found.' });

    // Fetch the actual transcript XML
    const xmlRes = await fetch(enTrack.baseUrl);
    const xml = await xmlRes.text();

    // Parse XML to plain text
    const texts = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/gs)]
      .map(m => m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, '')
      );

    const transcript = texts.join(' ');
    res.json({ transcript });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript: ' + err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Podcast backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
