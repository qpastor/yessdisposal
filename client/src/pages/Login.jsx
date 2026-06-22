import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoImg from "../assets/img/YessLogo.png";
import instance from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  // Push an extra dummy state to the history stack
  window.history.pushState(null, null, window.location.href);
  
  const handleBackButton = (e) => {
    e.preventDefault();
    // If they hit back, aggressively force them to stay on the login page
    window.history.pushState(null, null, window.location.href);
  };

  window.addEventListener('popstate', handleBackButton);

  return () => {
    window.removeEventListener('popstate', handleBackButton);
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors on a new attempt
    const loginData = { username, password };
    
    try {
      // 1. Fire the login request to your local instance configuration
      const response = await instance.post('/api/auth/login', loginData);
      
      // 2. Extract and save the token to localStorage
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      onLogin(response.data.user);
      navigate('/dashboard'); 

    } catch (err) {
      // Logs the full network issue directly to your browser's Console tab for easy debugging
      console.error("Caught login exception object:", err);

      // If the server responded with an error status code (e.g., 401 Unauthorized)
      if (err.response) {
        console.log("Server responded with status code:", err.response.status);
        console.log("Raw response data payload:", err.response.data);

        // Fallback chain to catch nested error objects, raw strings, or empty data layers
        const errorMessage = 
          err.response.data?.error || 
          err.response.data?.message || 
          (typeof err.response.data === 'string' && err.response.data.trim() !== '' ? err.response.data : null) ||
          "Incorrect username or password.";
        
        setError(errorMessage);
      } 
      // If the request was made but no response came back (Local backend server is down)
      else if (err.request) {
        console.log("No response received from local server:", err.request);
        setError("Unable to reach the server. Please check your local connection.");
      } 
      // Everything else (Configuration errors)
      else {
        console.log("Error building request execution:", err.message);
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    /* Background changed to the Dashboard Navy Blue */
    <div className="min-h-screen flex items-center justify-center bg-[#2c3e50] font-body p-4">
      
      {/* Card styled with a slightly lighter navy and white text */}
      <div className="w-full max-w-[350px] bg-[#34495e] p-8 rounded-xl shadow-2xl border border-slate-600">
        
        <div className="text-center mb-8">
          <div className="font-heading font-bold text-2xl tracking-tight text-white">
            <img src={LogoImg} alt="Company Logo" />
          </div>
          <p className="text-xs text-slate-300 mt-1">Waste Management • Disposal • Hauling</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Input Container */}
            <div className="flex items-center border border-slate-500 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
              <span className="p-3 bg-slate-700 border-r border-slate-500 text-sm">👤</span>
              <input 
                type="text" 
                placeholder="Username" 
                className="flex-1 p-2.5 outline-none text-sm bg-transparent text-white placeholder-slate-400" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            {/* Password Container */}
            <div className="flex items-center border border-slate-500 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
              <span className="p-3 bg-slate-700 border-r border-slate-500 text-sm">🔒</span>
              <input 
                type="password" 
                placeholder="Password" 
                className="flex-1 p-2.5 outline-none text-sm bg-transparent text-white placeholder-slate-400" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Red Alert Error Banner */}
          {error && (
            <div className="mt-4 p-2.5 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-xs text-center font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {/* Login Button */}
          <button className="w-full mt-6 bg-[#f1c40f] text-[#2c3e50] py-3 rounded-md font-bold hover:bg-[#f39c12] transition-colors">
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-300">
          <p>Forgot your password?</p>
          <a href="#" className="text-[#3498db] font-medium hover:underline mt-1 block">
            Contact Your Administrator
          </a>
        </div>
      </div>
    </div>
  );
}