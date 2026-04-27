import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, X, Save, User as UserIcon } from 'lucide-react';
import Sidebar from "../components/navigation/Sidebar";
import instance from '../api'; // Import the configured Axios instance

const FormRow = ({ label, children, required }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="md:col-span-2 flex items-center gap-4">
      {children}
    </div>
  </div>
);

const UserPage = ({ user }) => {
  const isAdmin = user?.role_name === 'Admin';
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    userid: '',
    name: '',
    username: '',
    email: '',
    isactive: false,
    role_id: ''
  });

  const isReadOnly = user?.role_name === 'View Only';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await instance.get('/api/auth/roles');
        setRoles(response.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await instance.get(`/api/auth/users/${id}`);
        const data = response.data;
        setFormData({
          ...data,
          userid: data.userid || '',
          name: data.name || '',
          username: data.username || '',
          email: data.email || '',
          isactive: data.isactive || false,
          role_id: data.role_id ? parseInt(data.role_id) : ''
        });
      } catch (err) {
        alert("Could not load user details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUserDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'role_id' ? parseInt(value, 10) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await instance.put(`/api/auth/users/${id}`, formData);
      alert("User updated successfully!");
    } catch (err) {
      alert("Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading User details...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-[250px] max-md:ml-[60px] transition-all duration-300 overflow-y-auto">
        <header className="bg-white p-6 shadow-sm border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-[#1e293b]">Edit User</h2>
          <Settings size={20} className="text-slate-400" />
        </header>

        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-[#2D3E50] px-8 py-4 flex items-center gap-3 text-white">
               <UserIcon size={20} />
               <h3 className="font-bold uppercase tracking-widest text-sm">{formData.name || 'User Profile'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-8 divide-y divide-gray-100">
              <section className="pb-6 space-y-2">
                <FormRow label="Full Name" required>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" required />
                </FormRow>

                <FormRow label="Username" required>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" required />
                </FormRow>

                <FormRow label="Email Address" required>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" required />
                </FormRow>

                <FormRow label="Account Status">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isactive" checked={formData.isactive} onChange={handleChange} disabled={isReadOnly} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className={`text-sm font-bold ${formData.isactive ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.isactive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </FormRow>

                <FormRow label="User Role">
                  <select name="role_id" value={formData.role_id} onChange={handleChange} disabled={isReadOnly} className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50">
                    {roles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                    ))}
                  </select>
                </FormRow>
              </section>

              <div className="pt-8 flex items-center justify-end gap-4">
                <button type="button" onClick={() => navigate('/user-management')} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold uppercase text-xs hover:bg-gray-50 transition">
                  <X size={16} /> Cancel
                </button>
                {isAdmin && (
                  <button type="submit" disabled={isSubmitting} className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-lg font-bold uppercase text-xs shadow-lg transition ${isSubmitting ? "bg-slate-400" : "bg-[#2D3E50] hover:bg-slate-700 active:scale-95"}`}>
                    <Save size={16} /> {isSubmitting ? "Updating..." : "Update User Details"}
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

export default UserPage;