import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const checkURL = async (url) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/check-url`, { url });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};