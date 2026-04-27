import axios from 'axios';

// Vite requires environment variables to start with "VITE_"
const instance = axios.create({
  // Use the Render URL if available, otherwise fallback to localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Crucial if you are using cookies/sessions
});

export default instance;