import React, { useState, useEffect } from 'react';
import Sidebar from "../components/navigation/Sidebar";
import instance from '../api';

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
const StatCard = ({ bgColor, title1, value1, title2, value2 }) => {
  return (
    /* Removed text-white and added shadow-sm */
    <div className={`${bgColor} flex-1 min-w-[240px] h-[160px] rounded-sm p-6 flex flex-col shadow-md`}>
      
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
const Dashboard = ({ user }) => {
  const [stats, setStats] = useState([]);

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden antialiased">
      <Sidebar user={user}/>
      <main className="flex-1 p-10 overflow-y-auto ml-[250px] max-md:ml-[60px] transition-all duration-300">
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
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;