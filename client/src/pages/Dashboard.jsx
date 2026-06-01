import React, { useState, useEffect, useCallback } from 'react';
import instance from '../api';
import { useNavigate } from 'react-router-dom';

// --- 2. HELPER ---
const getCardConfig = (statusName) => {
  switch (statusName) {
    // Added border for white card to maintain visibility
    case 'Scheduled': return { bgColor: 'bg-[#FFFFFF] border border-slate-200' };
    case 'Trucked Out': return { bgColor: 'bg-[#FFFF00]'};
    case 'Facility + Trucking Bill Received': return { bgColor: 'bg-[#92C47D]'};
    case 'Fully Billed': return { bgColor: 'bg-[#F1B217]' };
    case 'Cancelled': return { bgColor: 'bg-[#E68371]' };
    case 'Anomaly': return { bgColor: 'bg-[#B4A7D6]' };
    default: return { bgColor: 'bg-gray-400' };
  }
};

// --- 3. STATCARD ---
const StatCard = ({ bgColor, title1, value1, title2, value2, onClick }) => {
  return (
    /* Removed text-white and added shadow-sm */
    <div 
    onClick={onClick}
    className={`${bgColor} flex-1 min-w-[240px] h-[160px] rounded-sm p-6 flex flex-col shadow-md 
        cursor-pointer transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-xl hover:brightness-95`}>
      
      {/* Title: Using Slate 800 */}
      <div className="flex justify-between mb-4 text-[15px] font-medium text-slate-800 opacity-90">
        <span>{title1}</span>
      </div>

      {/* Main Value: Using Slate 900 for high contrast */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-4xl font-bold leading-none text-slate-900">{value1}</span>
      </div>

      {/* Footer: Using Slate 800 */}
      <div className="flex justify-between text-[13px] font-medium text-slate-800 opacity-80 mt-auto uppercase tracking-wider">
        <span>{title2}</span>
        <span>{value2}</span>
      </div>
    </div>
  );
};

const connectToQBO = () => {
    // This calls your backend route which redirects to Intuit
    window.open('http://localhost:5001/api/qbo/connect', '_blank', 'noreferrer');
};

// --- 4. MAIN DASHBOARD ---
const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [finStats, setFinStats] = useState({
  unpaid: 0,
  paid: 0,
  overdue: 0
});

const fetchQBOData = useCallback(() => {
  console.log("Fetching/Refreshing QBO data...");
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  fetch(`${baseUrl}/api/qbo/invoices`)
    .then(res => {
      if (!res.ok) {
        // If 401 or 500 occurs, throw to drop to the .catch() block
        throw new Error(`Server returned status ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        setInvoices(data);
        const now = new Date();
        const totals = data.reduce((acc, inv) => {
          const balance = parseFloat(inv.Balance || 0);
          const total = parseFloat(inv.TotalAmt || 0);
          const dueDate = new Date(inv.DueDate);

          if (balance > 0) {
            acc.unpaid += balance;
            if (dueDate < now) acc.overdue += balance;
          } else {
            acc.paid += total;
          }
          return acc;
        }, { unpaid: 0, paid: 0, overdue: 0 });
        setFinStats(totals);
      }
    })
    .catch(err => {
      console.error("QBO Fetch Error:", err);
      // Optional: Clear metrics or show a toast message if connection is dropped
      setFinStats({ unpaid: 0, paid: 0, overdue: 0 });
    });
}, []);

  // 2. Fetch Operational Stats on Load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await instance.get('/api/auth/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
    fetchQBOData(); // Also load QBO data immediately on load
  }, [fetchQBOData]);

  // 3. Listen for the "Connected" message from the Auth Tab
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "qbo_connected") {
        fetchQBOData(); // Automatically refresh when the callback tab closes
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchQBOData]);

  const handleCardClick = (statusName) => {
    navigate(`/task?status=${encodeURIComponent(statusName)}`);
  };

  return (

        <div className="p-10 antialiased">
    <h1 className="text-2xl font-bold text-slate-800 mb-8">Dashboard Overview</h1>

    {/* SECTION 1: QUICKBOOKS FINANCIALS */}
    <h2 className="text-xl font-bold text-slate-800 mb-4">QuickBooks Summary Status</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-6xl">
      <StatCard 
        bgColor="bg-orange-100 border-l-4 border-orange-500"
        title1="QBO Overdue"
        value1={`$${finStats.overdue.toLocaleString()}`}
        title2="Action Required"
      />
      <StatCard 
        bgColor="bg-blue-50 border-l-4 border-blue-500"
        title1="Total Unpaid"
        value1={`$${finStats.unpaid.toLocaleString()}`}
        title2="Outstanding Balance"
      />
      <StatCard 
        bgColor="bg-green-50 border-l-4 border-green-500"
        title1="Paid (Last 30 Days)"
        value1={`$${finStats.paid.toLocaleString()}`}
        title2="Revenue Received"
      />
    </div>

    {/* Hide the button if data is already visible to keep the UI clean */}
{invoices.length === 0 && (
  <button 
    onClick={connectToQBO} 
    className="bg-green-600 text-white px-6 py-2 rounded shadow-md hover:bg-green-700 transition-colors mb-10"
  >
    Connect QuickBooks Sandbox
  </button>
)}

    {/* SECTION 2: TASK STATUSES (Your existing code) */}
    <h2 className="text-xl font-bold text-slate-800 mb-4">Operational Status</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mb-8">
      {stats.map((stat, index) => {
        const config = getCardConfig(stat.status_name);
        return (
          <StatCard 
            key={index}
            bgColor={config.bgColor}
            title1={stat.status_name}
            value1={stat.count}
            title2="Updated Just Now"
            onClick={() => handleCardClick(stat.status_name)}
          />
        );
      })}
    </div>
  </div>
  );
};

export default Dashboard;