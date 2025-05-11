const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/rip', async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes('newgrounds.com/audio/listen/')) {
    return res.status(400).json({ error: 'Invalid Newgrounds URL' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Buscar el script que contiene la URL
    const scripts = $('script').toArray();
    let mp3Url = null;

    for (const script of scripts) {
      const content = $(script).html();
      if (content && content.includes('ng_filename')) {
        const match = content.match(/https:\\\/\\\/audio\.ngfiles\.com\\\/[^"]+\.mp3/);
        if (match) {
          // Limpiar la URL de los caracteres escapados
          mp3Url = match[0].replace(/\\\//g, '/');
          break;
        }
      }
    }

    if (!mp3Url) {
      return res.status(404).json({ error: 'MP3 URL not found in the page.' });
    }

    res.json({ mp3: mp3Url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch or parse Newgrounds page.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
