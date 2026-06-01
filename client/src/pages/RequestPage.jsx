import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, X, Save, Briefcase } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance

const FormRow = ({ label, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="md:col-span-2 flex items-center gap-4">
      {children}
    </div>
  </div>
);

const RequestPage = ({ user }) => {
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    project_details: '',
    contacted: false,
  });

  const isReadOnly = user?.role_name === 'View Only';
const formatDate = (dateString) => dateString ? dateString.split('T')[0] : '';

  useEffect(() => {
      if (notification) {
        const timer = setTimeout(() => {
          setNotification(null);
        }, 5000); // 5000ms = 5 seconds
  
        // Cleanup function to clear timer if component unmounts 
        // or if notification changes before timer finishes
        return () => clearTimeout(timer);
      }
  }, [notification]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await instance.get(`/api/auth/requests/${id}`);
        const request = response.data;
        setFormData({
          ...request,
          fullname: request.fullname || '',
          email: request.email || '',
          phone: request.phone || '',
          project_details: request.project_details || '',
          contacted: request.contacted || false,
        });
      } catch (err) {
        alert("Could not load request details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRequestDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await instance.put(`/api/auth/requests/${id}`, formData);
      const updated = response.data;
      
      setFormData({
        ...updated,
        contacted: updated.contacted || false,
        updated_at: formatDate(updated.updated_at)
      });
      setNotification({ type: 'success', message: "Request was successfully updated!" });
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to update request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading request details...</div>;

  return (
    <>
        {/* <header className="bg-white p-6 shadow-sm border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-[#1e293b]">Request Details</h2>
        </header> */}

        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-[#2D3E50] px-8 py-4 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                 <Briefcase size={20} />
                 <h3 className="font-bold uppercase tracking-widest text-sm">Request Information</h3>
               </div>
               <Settings size={18} className="opacity-50" />
            </div>

            <form onSubmit={handleSubmit} className="p-8 divide-y divide-gray-100">
              <section className="pb-6 space-y-1">
                <FormRow label="Full Name">
                    <label className="w-48 px-4 py-2 outline-none font-bold">{formData.fullname}</label>
                </FormRow>
                <FormRow label="Email">
                  <label className="w-48 px-4 py-2 outline-none font-bold">{formData.email}</label>
                </FormRow>
                <FormRow label="Phone">
                  <label className="w-48 px-4 py-2 outline-none font-bold">{formData.phone}</label>
                </FormRow>
                <FormRow label="Project Details">
                  <label className="w-48 px-4 py-2 outline-none font-bold">{formData.project_details}</label>
                </FormRow>
                <FormRow label="Contacted">
                  <select
                  name="contacted"
                  value={formData.contacted ? 'true' : 'false'}
                  onChange={(e) => {
                    // Convert the string value back to a real boolean for your state
                     setFormData({...formData,
                        contacted: e.target.value === 'true'
                    });
                }}
                className="w-48 px-4 py-2 bg-white border border-slate-200 rounded-sm font-medium text-slate-800 outline-none cursor-pointer transition-all focus:border-slate-400"
                >
                <option value="true">Yes</option>
                <option value="false">No</option>
                </select>
                </FormRow>
              </section>
                    
        {notification && (
            <div className={`mt-4 p-2.5 rounded-md text-xs text-center font-medium animate-pulse ${notification.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
              {notification.message}
            </div>
          )}
              <div className="pt-8 flex items-center justify-end gap-4">
                <button type="button" onClick={() => navigate('/request-list')} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold uppercase text-xs hover:bg-gray-50 transition">
                  <X size={16} /> Back to List
                </button>
                {!isReadOnly && (
                  <button type="submit" disabled={isSubmitting} className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-lg font-bold uppercase text-xs shadow-lg transition ${isSubmitting ? "bg-slate-400" : "bg-[#2D3E50] hover:bg-slate-700 active:scale-95"}`}>
                    <Save size={16} /> {isSubmitting ? "Saving..." : "Update Request"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
    </>
  );
};

export default RequestPage;