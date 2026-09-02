import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, X, Save, Briefcase } from 'lucide-react';
import instance from '../api';

const FormRow = ({ label, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="md:col-span-2 flex items-center gap-4">
      {children}
    </div>
  </div>
);

const RequestPage = ({ user }) => {
  const { id: paramId } = useParams(); // ID from URL parameter
  const navigate = useNavigate();
  
  const [requestId, setRequestId] = useState(null); // Stores the ACTUAL request ID
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await instance.get(`/api/auth/requests/${paramId}`);
        const request = response.data;

        // 🎯 FIX: Extract and save the true Request ID (or fallback to paramId)
        const actualRequestId = request.id || request.request_id || paramId;
        setRequestId(actualRequestId);

        setFormData({
          fullname: request.fullname || '',
          email: request.email || '',
          phone: request.phone || '',
          project_details: request.project_details || '',
          contacted: Boolean(request.contacted),
        });
      } catch (err) {
        console.error("Fetch request details error:", err);
        alert("Could not load request details.");
      } finally {
        setLoading(false);
      }
    };

    if (paramId) fetchRequestDetails();
  }, [paramId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    // Target the true request ID
    const targetId = requestId || paramId;

    const payload = {
      fullname: formData.fullname,
      email: formData.email,
      phone: formData.phone,
      project_details: formData.project_details,
      contacted: formData.contacted,
    };

    try {
      const response = await instance.put(`/api/auth/requests/${targetId}`, payload);
      
      if (response.data && typeof response.data === 'object') {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
          contacted: response.data.contacted !== undefined ? Boolean(response.data.contacted) : prev.contacted,
        }));
      }

      setNotification({ type: 'success', message: "Request was successfully updated!" });
    } catch (err) {
      console.error("Update request error:", err);
      setNotification({ 
        type: 'error', 
        message: err.response?.data?.error || err.response?.data?.message || "Failed to update request." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading request details...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-[#2D3E50] px-8 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Briefcase size={20} />
            <h3 className="font-bold uppercase tracking-widest text-sm">
              Request Information {requestId ? `(#${requestId})` : ''}
            </h3>
          </div>
          <Settings size={18} className="opacity-50" />
        </div>

        <form onSubmit={handleSubmit} className="p-8 divide-y divide-gray-100">
          <section className="pb-6 space-y-1">
            <FormRow label="Full Name">
              <input
                type="text"
                name="fullname"
                disabled={isReadOnly}
                value={formData.fullname}
                onChange={handleChange}
                className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-slate-400 font-bold text-slate-800 disabled:bg-slate-50"
              />
            </FormRow>

            <FormRow label="Email">
              <input
                type="email"
                name="email"
                disabled={isReadOnly}
                value={formData.email}
                onChange={handleChange}
                className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-slate-400 font-bold text-slate-800 disabled:bg-slate-50"
              />
            </FormRow>

            <FormRow label="Phone">
              <input
                type="text"
                name="phone"
                disabled={isReadOnly}
                value={formData.phone}
                onChange={handleChange}
                className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-slate-400 font-bold text-slate-800 disabled:bg-slate-50"
              />
            </FormRow>

            <FormRow label="Project Details">
              <textarea
                name="project_details"
                disabled={isReadOnly}
                rows={3}
                value={formData.project_details}
                onChange={handleChange}
                className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-slate-400 font-bold text-slate-800 disabled:bg-slate-50"
              />
            </FormRow>

            <FormRow label="Contacted">
              <select
                name="contacted"
                disabled={isReadOnly}
                value={formData.contacted ? 'true' : 'false'}
                onChange={(e) => setFormData((prev) => ({ ...prev, contacted: e.target.value === 'true' }))}
                className="w-48 px-4 py-2 bg-white border border-slate-200 rounded-md font-medium text-slate-800 outline-none cursor-pointer focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </FormRow>
          </section>

          {notification && (
            <div className={`p-4 rounded my-4 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {notification.message}
            </div>
          )}

          <div className="pt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/request-list')}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold uppercase text-xs hover:bg-gray-50 transition"
            >
              <X size={16} /> Back to List
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-lg font-bold uppercase text-xs shadow-lg transition ${
                  isSubmitting ? "bg-slate-400" : "bg-[#2D3E50] hover:bg-slate-700 active:scale-95"
                }`}
              >
                <Save size={16} /> {isSubmitting ? "Saving..." : "Update Request"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestPage;