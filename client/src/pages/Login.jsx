import React, { useState, useEffect } from 'react';
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
      // Force user to stay on the login page if they hit back
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
      // 1. Fire the login request
      const response = await instance.post('/api/auth/login', loginData);
      
      // 2. Extract access token & refresh token
      const accessToken = response.data?.accessToken || response.data?.token;
      const refreshToken = response.data?.refreshToken;

      // 3. Save tokens to localStorage for api.js interceptor
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // 4. Trigger state update and navigate
      if (response.data?.user) {
        const userData = response.data.user;
        
        // Save user state
        onLogin(userData);

        // Normalize Role checking (catches numbers 2, string "2", "Field Manager", "field manager", etc.)
        const userRoleName = (userData.role || userData.role_name || '').toString().toLowerCase();
        const userRoleId = (userData.role_id || '').toString();

        const isFieldManager = userRoleName === 'field manager' || userRoleId === '2' || userRoleId === 2;

        if (isFieldManager) {
          // Double check if your App.jsx route uses '/master-list' or '/masterlist'
          navigate('/master-list', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {

      if (err.response) {
        const errorMessage = 
          err.response.data?.error || 
          err.response.data?.message || 
          (typeof err.response.data === 'string' && err.response.data.trim() !== '' ? err.response.data : null) ||
          "Incorrect username or password.";
        
        setError(errorMessage);
      } else if (err.request) {
        setError("Unable to reach the server. Please check your local connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2c3e50] font-body p-4">
      <div className="w-full max-w-[350px] bg-[#34495e] p-8 rounded-xl shadow-2xl border border-slate-600">
        
        <div className="text-center mb-8">
          <div className="font-heading font-bold text-2xl tracking-tight text-white">
            <img src={LogoImg} alt="Company Logo" />
          </div>
          <p className="text-xs text-slate-300 mt-1">Waste Management • Disposal • Hauling</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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

          {error && (
            <div className="mt-4 p-2.5 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-xs text-center font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

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