import axios from 'axios';

// Detect the API URL based on the environment
// const API_BASE_URL = import.meta.env.MODE === 'production'
//   ? 'https://yess-disposal-api.onrender.com'
//   : 'http://localhost:5001';

const API_BASE_URL = import.meta.env.VITE_API_URL //|| 'http://localhost:5001';

const instance = axios.create({
  // If the environment variable fails, it falls back to localhost
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default instance;