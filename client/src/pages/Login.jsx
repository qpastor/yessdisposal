import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoImg from "../assets/img/YessLogo.png";
import instance from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = { username, password };
    
    try {
      const response = await instance.post('/api/auth/login', loginData);
      onLogin(response.data.user);
      navigate('/dashboard'); 

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      alert(errorMessage);
      console.error("Error connecting to server:", error);
    }
  };

  return (
    /* Background changed to the Dashboard Navy Blue */
    <div className="min-h-screen flex items-center justify-center bg-[#2c3e50] font-body p-4">
      
      {/* Card styled with a slightly lighter navy and white text */}
      <div className="w-full max-w-[350px] bg-[#34495e] p-8 rounded-xl shadow-2xl border border-slate-600">
        
        <div className="text-center mb-8">
          <div className="font-heading font-bold text-2xl tracking-tight text-white"> <img src={LogoImg} alt="Company Logo" /></div>
          {/* <h2 className="text-xl font-semibold mt-2 text-white">Yess Trucking & Disposal</h2> */}
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

          {/* Login Button - Kept the yellow from image 1 but optimized for dark theme */}
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