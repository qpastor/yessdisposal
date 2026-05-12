import React, { useState, useEffect } from 'react';
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

// --- 4. MAIN DASHBOARD ---
const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();

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
  }, []);

  const handleCardClick = (statusName) => {
    // Navigates to Task List with a query parameter
    navigate(`/task?status=${encodeURIComponent(statusName)}`);
  };

  return (
    <div className="p-10 antialiased">
      {/* Page Header (Optional but recommended for consistency) */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
      </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {stats.map((stat, index) => {
            const config = getCardConfig(stat.status_name);
            return (
              <StatCard 
                key={index}
                bgColor={config.bgColor}
                title1={stat.status_name}
                value1={stat.count}
                title2="Updated Just Now"
                value2=""
                onClick={() => handleCardClick(stat.status_name)}
              />
            );
          })}
        </div>
        </div>
  );
};

export default Dashboard;