import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, KeyRound } from 'lucide-react';
import {SidebarData} from "./SidebarData";
import styles from "./Sidebar.module.css";
import LogoImg from "../../assets/img/YessLogo.png";
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api';

function Sidebar({ user }) {
  const navigate = useNavigate();
  const [subnav, setSubnav] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showSubnav = () => setSubnav(!subnav);

  const handleLogout = async () => {
    try {
      const response = await api.post('/api/auth/logout');

      if (response.ok) {
        navigate('/login'); // Redirect to login page
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    setIsUpdating(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // If your auth session uses credentials/cookies, keep this line. 
        // If it relies on a localStorage JWT token, replace with: 'Authorization': `Bearer ${localStorage.getItem('token')}`
        credentials: 'include', 
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password updated successfully!");
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsModalOpen(false); // Close modal on success
      } else {
        toast.error(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not connect to the server.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.sidebar}>
      {/* --- New Logo Section --- */}
      <div className={styles.logoContainer}>
         {/* If using an image file: */}
         <img src={LogoImg} alt="Company Logo" className={styles.logo} />

      </div>
      <ul className={styles.sidebarList}>
        {SidebarData.map((val,key) =>{
          // --- HIDE USER MANAGEMENT IF ROLE IS VIEW ONLY ---
          if (val.title === "User Management" && user?.role_name === 'View Only') {
            return null; // Skip rendering this item
          }
      return(
       <React.Fragment key={key}>
              <li
                className={styles.row}
                onClick={() => {
                  if (val.title === "Logout") {
                    handleLogout();
                  } else if (val.subNav) {
                    showSubnav(); // Toggle dropdown
                  } else {
                    navigate(val.link);
                  }
                }}
              >
                <div className={styles.icon}>{val.icon}</div>
                <div className={styles.title}>{val.title}</div>
                
                {/* Show arrow icon if subnav exists */}
                {val.subNav && (
                  <div className={styles.arrow}>
                    {subnav ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                )}
              </li>

              {/* Render Sub-items if menu is open and subNav exists */}
              {val.subNav && subnav && (
                <ul className={styles.subList}>
                  {val.subNav.map((subItem, index) => (
                    <li
                      key={index}
                      className={styles.subRow}
                      onClick={() => navigate(subItem.link)}
                    >
                      <div className={styles.title}>{subItem.title}</div>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
      )
    })}
    </ul>
      <div className={styles.sidebarFooter}>
        <div className={styles.footerLabel}>Logged in as:</div>
        <div className={styles.footerUser}>{user?.name || "AAA"}</div>
      {/* --- SELF PASSWORD RESET INLINE MODAL TRIGGER --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className={styles.passwordResetBtn}>
              <KeyRound size={13} />
              Change Password
            </button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Change Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordReset} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                />
              </div>
              <Button type="submit" disabled={isUpdating} className="w-full mt-2">
                {isUpdating ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Sidebar