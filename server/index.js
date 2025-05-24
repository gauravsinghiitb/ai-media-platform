const express = require('express');
const cors = require('cors');
const generateImageRouter = require('./routes/generateImage');

const app = express();

// Enable CORS for the frontend (running on http://localhost:3000)
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Parse JSON bodies

// Route for image generation
app.use('/api/generateImage', generateImageRouter);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});