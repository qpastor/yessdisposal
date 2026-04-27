import axios from 'axios';

const instance = axios.create({
  // If the environment variable fails, it falls back to localhost
  baseURL: import.meta.env.VITE_API_URL|| 'https://yess-disposal-api.onrender.com',
  withCredentials: true,
});

export default instance;