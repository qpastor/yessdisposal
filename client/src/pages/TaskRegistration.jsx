import React, { useState, useEffect } from 'react';
import { Save, XCircle } from 'lucide-react';
import axios from 'axios';
import Sidebar from "../components/navigation/Sidebar";
import { useNavigate } from 'react-router-dom';
import instance from '../api'; // Import the configured Axios instance

const TaskRegistrationForm = ({ user }) => {
  const isAdmin = user?.role_name === 'Admin';
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [formData, setFormData] = useState({
    status_id: '',
    schedule_date: '',
    jobSite: '',
    customer: '',
    loads: '',
    material: '',
    trucker: '',
    dumpFacility: '',
    invoice: ''
  });

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await instance.get('/api/auth/statuses');
        setStatuses(response.data);
        if (response.data.length > 0 && !formData.status_id) {
          setFormData(prev => ({ ...prev, status_id: response.data[0].status_id }));
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    fetchStatuses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/auth/task-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          loads: Number(formData.loads),
          job_site: formData.jobSite,
          dump_facility: formData.dumpFacility
        }),
      });

      if (response.ok) {
        alert('Task created successfully!');
        navigate('/master-list');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to create task'}`);
      }
    } catch (err) {
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} />

      {/* Responsive margin added here */}
      <main className="flex-1 ml-[250px] max-md:ml-[60px] transition-all duration-300 overflow-y-auto">
        <header className="bg-white p-6 shadow-sm border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-[#1e293b]">Task Registration</h2>
        </header>

        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-8 pt-8 pb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Job Information</h3>
              <div className="h-1 bg-green-500 w-16 mb-8 rounded-full"></div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {/* Status Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status *</label>
                    <select name="status_id" value={formData.status_id} onChange={handleChange} disabled={!isAdmin} className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      {statuses.map((status) => (
                        <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule Date *</label>
                    <input type="date" name="schedule_date" value={formData.schedule_date} onChange={handleChange} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Job Site */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Job Site *</label>
                    <input type="text" name="jobSite" value={formData.jobSite} onChange={handleChange} placeholder="Location Name" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Customer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer *</label>
                    <input type="text" name="customer" value={formData.customer} onChange={handleChange} placeholder="Client Name" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Loads */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loads *</label>
                    <input type="number" name="loads" value={formData.loads} onChange={handleChange} placeholder="0" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Material */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Material *</label>
                    <input type="text" name="material" value={formData.material} onChange={handleChange} placeholder="e.g. Dirt, Gravel" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Trucker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trucker *</label>
                    <input type="text" name="trucker" value={formData.trucker} onChange={handleChange} placeholder="Driver Name" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  {/* Invoice */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</label>
                    <input type="text" name="invoice" value={formData.invoice} onChange={handleChange} placeholder="Inv-001" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 pb-8">
                  <button type="submit" className="flex items-center justify-center gap-2 px-8 py-3 bg-[#2D3E50] text-white font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                    <Save size={18} /> Create Task
                  </button>
                  <button type="button" onClick={() => navigate('/master-list')} className="px-8 py-3 bg-white text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskRegistrationForm;