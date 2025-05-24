import axios from 'axios';

const IMGUR_CLIENT_ID = 'YOUR_IMGUR_CLIENT_ID'; // Replace with your Imgur Client ID

export const uploadToImgur = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post('https://api.imgur.com/3/image', formData, {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.data.link; // Returns the URL of the uploaded image
    } else {
      throw new Error('Imgur upload failed');
    }
  } catch (error) {
    console.error('Imgur upload error:', error);
    throw new Error('Failed to upload to Imgur');
  }
};