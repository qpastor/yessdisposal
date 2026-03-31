import React from 'react';
import './Login.css';


export default function Login() {
  return (
    /* 'min-h-screen' and 'flex items-center justify-center' handles the centering */
    <div className="min-h-screen flex items-center justify-center bg-muted/30 font-body">
      
      {/* 'max-w-[350px]' locks the width and prevents stretching */}
      <div className="w-full max-w-[350px] bg-card p-8 rounded-xl shadow-lg border border-border">
        
        <div className="text-center mb-8">
          <div className="font-heading font-bold text-2xl tracking-tight">YESS LOGO</div>
          <h2 className="text-xl font-semibold mt-2 text-foreground">Yess Trucking & Disposal</h2>
          <p className="text-xs text-muted-foreground mt-1">Waste Management • Disposal • Hauling</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="p-3 bg-muted border-r border-input text-sm">👤</span>
            <input type="text" placeholder="Username" className="flex-1 p-2.5 outline-none text-sm bg-transparent" />
          </div>
          
          <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="p-3 bg-muted border-r border-input text-sm">🔒</span>
            <input type="password" placeholder="Password" className="flex-1 p-2.5 outline-none text-sm bg-transparent" />
          </div>
        </div>

        <button className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-md font-semibold hover:opacity-90 transition-opacity">
          Login
        </button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Forgot your password?</p>
          <a href="#" className="text-accent font-medium hover:underline mt-1 block">Contact Your Administrator</a>
        </div>
      </div>
    </div>
  );
}
