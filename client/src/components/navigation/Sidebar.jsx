// src/components/navigation/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarData } from './SidebarData';
import styles from "./Sidebar.module.css";
import LogoImg from "../../assets/img/YessLogo.png";
import { ChangePasswordModal } from '../navigation/ChangePasswordModal';
import instance from '../../api';

// Optional: Import a Key icon from lucide-react or react-icons
import { Key } from 'lucide-react'; 

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Normalize role string and ID
  const roleStr = String(user?.role || user?.role_name || '').toLowerCase();
  const roleId = String(user?.role_id || '');

  const isAdmin = roleStr === 'admin' || roleId === '1';
  const isFieldManager = roleStr === 'field manager' || roleId === '2';

  // Get user display name (fallback to 'User')
  const userName = user?.name || user?.username || 'Admin Qin';

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await instance.post('/api/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');

      if (typeof onLogout === 'function') {
        onLogout();
      }

      navigate('/login', { replace: true });
    }
  };

  // Open the change password modal
  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  // Handle password submit request via backend API
  const handlePasswordSubmit = async (currentPassword, newPassword) => {
    try {
      const response = await instance.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password.';
      throw new Error(message);
    }
  };

  return (
    <>
      <aside className="w-[250px] max-md:w-[60px] fixed left-0 top-0 h-full bg-[#1e293b] text-white transition-all duration-300 flex flex-col justify-between z-40">
        {/* Top Section: Logo & Nav Links */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-700/50">
            <img src={LogoImg} alt="Company Logo" className={styles.logo}/>
          </div>

          <nav className="p-2 space-y-1">
            {SidebarData.map((item) => {
              // Always show Logout button
              if (item.link === '/logout') {
                return (
                  <button
                    key={item.title || 'logout'}
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/10 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    {item.icon}
                    <span className="max-md:hidden">{item.title}</span>
                  </button>
                );
              }

              // Filter logic
              if (!isAdmin) {
                if (isFieldManager) {
                  const allowedLinks = ['/tasks', '/task', '/request-list', '/master-list', '/masterlist'];
                  const itemLinkLower = (item.link || '').toLowerCase();
                  
                  const isAllowed = allowedLinks.some((path) =>
                    itemLinkLower.startsWith(path)
                  );
                  
                  if (!isAllowed) return null;
                } else {
                  return null;
                }
              }

              const isActive = location.pathname.toLowerCase() === item.link?.toLowerCase();

              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="max-md:hidden">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logged In User & Change Password */}
        <div className="p-4 bg-[#182232] border-t border-slate-700/50 flex flex-col gap-2">
          <div className="max-md:hidden flex flex-col">
            <span className="text-xs text-slate-400">Logged in as:</span>
            <span className="text-sm font-semibold text-white truncate">{userName}</span>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 border border-slate-600 hover:border-slate-500 rounded-lg hover:bg-slate-700/50 hover:text-white transition-all max-md:p-2 cursor-pointer"
            title="Change Password"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="max-md:hidden">Change Password</span>
          </button>
        </div>
      </aside>

      {/* Modal Component */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
    </>
  );
}