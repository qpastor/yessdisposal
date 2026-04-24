import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, X, Save, Briefcase } from 'lucide-react';
import Sidebar from "../components/navigation/Sidebar";

const FormRow = ({ label, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="md:col-span-2 flex items-center gap-4">
      {children}
    </div>
  </div>
);

const TaskPage = ({ user }) => {
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    schedule_date: '',
    customer: '',
    loads: '',
    material: '',
    trucker: '',
    dump_facility: '',
    invoice: '',
    completed_date: '',
    actual_loads: '',
    status_id: ''
  });

  const isReadOnly = user?.role_name === 'View Only';
  const formatDate = (dateString) => dateString ? dateString.split('T')[0] : '';

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/auth/statuses');
        setStatuses(response.data);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    fetchStatuses();
  }, []);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/auth/tasks/${id}`);
        const task = response.data;
        setFormData({
          ...task,
          schedule_date: formatDate(task.schedule_date),
          completed_date: formatDate(task.completed_date),
          customer: task.customer || '',
          loads: task.loads || '',
          material: task.material || '',
          trucker: task.trucker || '',
          dump_facility: task.dump_facility || '',
          invoice: task.invoice || '',
          actual_loads: task.actual_loads || '',
          status_id: task.status_id || ''
        });
      } catch (err) {
        alert("Could not load task details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTaskDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.put(`http://localhost:5001/api/auth/tasks/${id}`, formData);
      const updated = response.data;
      setFormData({
        ...updated,
        schedule_date: formatDate(updated.schedule_date),
        completed_date: formatDate(updated.completed_date),
      });
      alert("Task updated successfully!");
    } catch (err) {
      alert("Failed to update task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading task details...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-[250px] max-md:ml-[60px] transition-all duration-300 overflow-y-auto">
        <header className="bg-white p-6 shadow-sm border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-[#1e293b]">Job Details</h2>
        </header>

        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-[#2D3E50] px-8 py-4 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                 <Briefcase size={20} />
                 <h3 className="font-bold uppercase tracking-widest text-sm">Task Information</h3>
               </div>
               <Settings size={18} className="opacity-50" />
            </div>

            <form onSubmit={handleSubmit} className="p-8 divide-y divide-gray-100">
              <section className="pb-6 space-y-1">
                <FormRow label="Status">
                  <select name="status_id" value={formData.status_id} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 font-bold text-blue-600">
                    {statuses.map((status) => (
                      <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Schedule Date">
                  <input type="date" name="schedule_date" value={formData.schedule_date} onChange={handleChange} disabled={isReadOnly} className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>

                <FormRow label="Customer">
                  <input type="text" name="customer" value={formData.customer} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>

                <FormRow label="Expected Loads">
                  <input type="number" name="loads" value={formData.loads} onChange={handleChange} disabled={isReadOnly} className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>
              </section>

              <section className="py-6 space-y-1">
                <FormRow label="Invoice #">
                  <input type="text" name="invoice" value={formData.invoice} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>

                <FormRow label="Completed Date">
                  <input type="date" name="completed_date" value={formData.completed_date} onChange={handleChange} disabled={isReadOnly} className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>

                <FormRow label="Actual Loads">
                  <input type="number" name="actual_loads" value={formData.actual_loads} onChange={handleChange} disabled={isReadOnly} className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </FormRow>
              </section>

              <div className="pt-8 flex items-center justify-end gap-4">
                <button type="button" onClick={() => navigate('/master-list')} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold uppercase text-xs hover:bg-gray-50 transition">
                  <X size={16} /> Back to List
                </button>
                {!isReadOnly && (
                  <button type="submit" disabled={isSubmitting} className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-lg font-bold uppercase text-xs shadow-lg transition ${isSubmitting ? "bg-slate-400" : "bg-[#2D3E50] hover:bg-slate-700 active:scale-95"}`}>
                    <Save size={16} /> {isSubmitting ? "Saving..." : "Update Task"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskPage;