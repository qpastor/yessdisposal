import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminResetPasswordModal = ({ isOpen, onClose, selectedUser, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !selectedUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(selectedUser.id || selectedUser._id, newPassword);
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl bg-[#1e293b] p-6 text-slate-100 shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Reset Password</h2>
              <p className="text-xs text-slate-400">
                Target User: <span className="text-blue-400 font-medium">{selectedUser.name || selectedUser.username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-emerald-400 font-medium">Password successfully reset for {selectedUser.name || selectedUser.username}!</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  placeholder="Enter new password"
                  className="w-full pl-3 pr-10 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Resetting...</span>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Override Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};