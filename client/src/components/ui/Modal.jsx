import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Added sizeClass prop with a default value of 'max-w-lg'
export default function Modal({ isOpen, onClose, title, children, sizeClass = 'max-w-lg' }) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal content container — Now uses dynamic sizeClass */}
      <div className={`relative bg-white rounded-xl shadow-xl border border-gray-100 ${sizeClass} w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10`}>
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#2D3E50] text-white p-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Body content based on children */}
        <div className="p-6">
          {children}
        </div>
        
      </div>
    </div>
  );
}