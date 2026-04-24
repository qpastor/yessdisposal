import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {SidebarData} from "./SidebarData";
import styles from "./Sidebar.module.css";
import LogoImg from "../../assets/img/YessLogo.png";

function Sidebar({ user }) {
  const navigate = useNavigate();
  const [subnav, setSubnav] = useState(false);

  const showSubnav = () => setSubnav(!subnav);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Sends the cookie to the server to be cleared
      });

      if (response.ok) {
        navigate('/login'); // Redirect to login page
      }
    } catch (error) {
      console.error("Logout failed:", error);
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
      </div>
    </div>
  )
}

export default Sidebar