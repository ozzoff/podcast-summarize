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
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
      headers: {
        'x-api-key': process.env.SUPADATA_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok || !data.content) {
      return res.status(404).json({ error: 'Could not fetch transcript. Video may have captions disabled.' });
    }

    res.json({ transcript: data.content });

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
