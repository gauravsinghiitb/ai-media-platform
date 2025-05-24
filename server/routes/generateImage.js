const express = require('express');
const router = express.Router();
const { PythonShell } = require('python-shell');

router.post('/', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    console.error("Invalid prompt received:", prompt);
    return res.status(400).json({ error: "Invalid prompt. Please provide a valid string." });
  }

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './server/scripts',
    args: [prompt]
  };

  try {
    console.log("Generating image for prompt:", prompt);
    const result = await new Promise((resolve, reject) => {
      PythonShell.run('generate_image.py', options, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!result || !result[0]) {
      throw new Error("Python script did not return a valid base64 image");
    }

    const base64Image = result[0]; // The Python script returns the base64 string
    console.log("Image generation successful:", base64Image.length, "bytes");
    res.json({ image: base64Image });
  } catch (error) {
    console.error("Image generation failed with error:", error.message);
    console.error("Full error details:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

module.exports = router;