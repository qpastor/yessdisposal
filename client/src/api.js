import axios from 'axios';

const getBaseURL = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:5000';
};

// Vite requires environment variables to start with "VITE_"
const instance = axios.create({
  // Use the Render URL if available, otherwise fallback to localhost
  baseURL: getBaseURL(),
  withCredentials: true, // Crucial if you are using cookies/sessions
});

export default instance;

