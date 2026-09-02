import React, { useState } from 'react';
import { Key, Eye, EyeOff, X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const toggleVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData.currentPassword, formData.newPassword);
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl bg-[#1e293b] p-6 text-slate-100 shadow-2xl border border-slate-700/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Key size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-emerald-400 font-medium">Password updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => toggleVisibility('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => toggleVisibility('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => toggleVisibility('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/60">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50">
                {loading ? <span>Updating...</span> : <><Lock size={14} /><span>Update Password</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};