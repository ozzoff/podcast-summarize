const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/transcript', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map(t => t.text).join(' ');
    res.json({ transcript: text });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch transcript. Video may have captions disabled.' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Podcast backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
