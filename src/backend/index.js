const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); // Corrected path

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ai-media-platform-default-rtdb.firebaseio.com",
    storageBucket: "ai-media-platform.appspot.com" // Added correct bucket name
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

// Test bucket access
const bucket = admin.storage().bucket();
bucket.getMetadata()
  .then((metadata) => {
    console.log('Bucket verified. Metadata:', metadata[0]);
  })
  .catch((err) => {
    console.error('Error verifying Firebase Storage bucket:', err.message);
    process.exit(1);
  });