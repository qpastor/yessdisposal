import React, { useState, useEffect, useCallback } from 'react';
import instance from '../api';
import { useNavigate } from 'react-router-dom';

// --- 2. HELPER ---
const getCardConfig = (statusName) => {
  switch (statusName) {
    case 'Scheduled': return { bgColor: 'bg-[#FFFFFF] border border-slate-200' };
    case 'Trucked Out': return { bgColor: 'bg-[#FFFF00]'};
    case 'Facility + Trucking Bill Received': return { bgColor: 'bg-[#92C47D]'};
    case 'Fully Billed': return { bgColor: 'bg-[#F1B217]' };
    case 'Cancelled': return { bgColor: 'bg-[#E68371]' };
    case 'Anomaly': return { bgColor: 'bg-[#B4A7D6]' };
    
    // New Invoice Missing Categories
    case 'No Invoice': return { bgColor: 'bg-red-50 border-l-4 border-red-500' };
    case 'No Dump Facility Invoice': return { bgColor: 'bg-amber-50 border-l-4 border-amber-500' };
    case 'No Trucker Invoice': return { bgColor: 'bg-yellow-50 border-l-4 border-yellow-500' };
    
    default: return { bgColor: 'bg-gray-400' };
  }
};

// --- 3. STATCARD ---
const StatCard = ({ bgColor, title1, value1, title2, value2, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`${bgColor} flex-1 min-w-[240px] h-[160px] rounded-sm p-6 flex flex-col shadow-md 
        cursor-pointer transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-xl hover:brightness-95`}
    >
      <div className="flex justify-between mb-4 text-[15px] font-medium text-slate-800 opacity-90">
        <span>{title1}</span>
      </div>

      <div className="flex justify-between items-center mb-5">
        <span className="text-4xl font-bold leading-none text-slate-900">{value1}</span>
      </div>

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
  const [missingInvoices, setMissingInvoices] = useState({
    no_invoice_count: 0,
    no_dump_facility_invoice_count: 0,
    no_trucker_invoice_count: 0
  });
  
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [finStats, setFinStats] = useState({ unpaid: 0, paid: 0, overdue: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const fetchQBOData = useCallback(() => {
    console.log("Fetching/Refreshing QBO data...");
    const baseUrl = import.meta.env.VITE_API_URL;
    fetch(`${baseUrl}/api/qbo/invoices`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
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
        setFinStats({ unpaid: 0, paid: 0, overdue: 0 });
      });
  }, []);

  // Fetch Operational Stats (Array)
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

  // Fetch Missing Invoices (Single Hook with Debugging Logs)
  useEffect(() => {
    const fetchMissingInvoices = async () => {
      try {
        const res = await instance.get('/api/auth/missing-invoices');
        console.log("WHAT THE BACKEND SENT:", res.data); 
        if (res.data) {
          setMissingInvoices(res.data);
        }
      } catch (err) {
        console.error("Error fetching missing invoices:", err);
      }
    };
    fetchMissingInvoices();
  }, []);

  const handleCardClick = (statusName) => {
    navigate(`/task?status=${encodeURIComponent(statusName)}`);
  };

  const operationalStatuses = ['Scheduled', 'Trucked Out', 'Facility + Trucking Bill Received', 'Fully Billed', 'Cancelled', 'Anomaly', 'Completed'];

  return (
    <div className="p-10 antialiased">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Dashboard Overview</h1>

      {/* SECTION 1: OPERATIONAL STATUSES */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Operational Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mb-8">
        {stats
          .filter(stat => operationalStatuses.includes(stat.status_name))
          .map((stat, index) => {
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

      {/* SECTION 2: FINANCIAL STATUS */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Financial Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mb-8">
        
        {/* Card 1: No Invoice */}
        <StatCard 
          bgColor={getCardConfig('No Invoice').bgColor}
          title1="No Invoice"
          value1={missingInvoices.no_invoice_count}
          title2="Attention Required"
          onClick={() => handleCardClick('No Invoice')}
        />

        {/* Card 2: No Dump Facility Invoice */}
        <StatCard 
          bgColor={getCardConfig('No Dump Facility Invoice').bgColor}
          title1="No Dump Facility Invoice"
          value1={missingInvoices.no_dump_facility_invoice_count}
          title2="Attention Required"
          onClick={() => handleCardClick('No Dump Facility Invoice')}
        />

        {/* Card 3: No Trucker Invoice */}
        <StatCard 
          bgColor={getCardConfig('No Trucker Invoice').bgColor}
          title1="No Trucker Invoice"
          value1={missingInvoices.no_trucker_invoice_count}
          title2="Attention Required"
          onClick={() => handleCardClick('No Trucker Invoice')}
        />

      </div>
    </div>
  );
};

export default Dashboard;