import React, { useState, useEffect } from 'react';
import { Search, Edit3 } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance
import Modal from '../components/ui/Modal'; // Import the Modal component

export default function RequestTable({ user }) {
  const [requests, setRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Modal Control States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --- Form State for Editing Requests ---
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    project_details: '',
    contacted: false
  });

  const isViewOnly = user?.role_name === 'View Only';

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-gray-400">N/A</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch Data from Backend
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/api/auth/requests');
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Failed to fetch requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- Trigger View Details Modal (Clicking Grid View Row) ---
  const viewRequest = async (id) => {
    setModalMode('view');
    setModalLoading(true);
    setIsModalOpen(true);
    try {
      const response = await instance.get(`/api/auth/requests/${id}`);
      setSelectedRequest(response.data);
    } catch (err) {
      console.error("Error fetching request details:", err);
      alert("Failed to fetch request details.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Transition from View to Edit mode ---
  const handleSwitchToEditMode = () => {
    if (!selectedRequest) return;

    setFormData({
      fullname: selectedRequest.fullname || '',
      email: selectedRequest.email || '',
      phone: selectedRequest.phone || '',
      project_details: selectedRequest.project_details || '',
      contacted: !!selectedRequest.contacted
    });

    setModalMode('edit');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Form Submit Handler (Stays as View Only on Success) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const id = selectedRequest.request_id;
      await instance.put(`/api/auth/requests/${id}`, formData);
      
      // Refresh background grid table entries
      await fetchRequests();

      // Fetch fresh database record to update view details cleanly
      const updatedDetails = await instance.get(`/api/auth/requests/${id}`);
      setSelectedRequest(updatedDetails.data);
      
      // Pivot operational focus back to view mode layout frame
      setModalMode('view');
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Failed to update request content parameters.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading) return <div className="p-10 text-center">Loading requests...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* --- Toolbar --- */}
       <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
  <div className="flex items-center gap-2 flex-1 w-full">
    {/* Expanded from max-w-sm to max-w-2xl to give it a spacious, elegant look */}
    <div className="relative w-full max-w-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input 
        type="text" 
        placeholder="Search requests..." 
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" 
      />
    </div>
  </div>
</div>

        {/* --- Grid View Table --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D3E50] text-white text-sm font-medium select-none">
                <th className="p-4 font-semibold rounded-tl-xl">Request #</th>
                <th className="p-4 font-semibold">Full Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Project Details</th>
                <th className="p-4 font-semibold">Requested Date</th>
                <th className="p-4 font-semibold rounded-tr-xl">Contacted?</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm divide-y divide-gray-100">
              {requests.map((request) => (
                <tr 
                  key={request.request_id} 
                  onClick={() => viewRequest(request.request_id)}
                  className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-semibold text-gray-800">{request.request_id}</td>
                  <td className="p-4 text-gray-700">{request.fullname}</td>
                  <td className="p-4 text-gray-700">{request.email}</td>
                  <td className="p-4 text-gray-700">{request.phone}</td>
                  <td className="p-4 text-gray-700 max-w-xs truncate">{request.project_details}</td>
                  <td className="p-4 text-gray-700">
                    {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      request.contacted 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {request.contacted ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- View / Edit Conditional Modal --- */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          sizeClass="max-w-xl"
          title={modalMode === 'edit' ? `Modify Inbound Request — ID: #${selectedRequest?.request_id || ''}` : `Request Entry Info — ID: #${selectedRequest?.request_id || ''}`}
        >
          {modalLoading ? (
            <div className="p-10 text-center text-sm text-gray-500 font-medium">Synchronizing application context pipelines...</div>
          ) : modalMode === 'edit' ? (
            /* ==================== FORM EDIT MODE ==================== */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" required name="fullname" value={formData.fullname} onChange={handleInputChange}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" required name="email" value={formData.email} onChange={handleInputChange}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" required name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Project Details</label>
                  <textarea 
                    name="project_details" rows="4" value={formData.project_details} onChange={handleInputChange}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" name="contacted" id="contacted" checked={formData.contacted} onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="contacted" className="text-sm font-medium text-gray-700 select-none">Mark client as contacted</label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                <button 
                  type="button" 
                  onClick={() => setModalMode('view')} 
                  className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 text-gray-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* ==================== DISPLAY VIEW MODE ==================== */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Status</label>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    selectedRequest?.contacted 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedRequest?.contacted ? 'Contacted' : 'Pending Callback'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Inbound Date</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedRequest?.created_at)}</p>
                </div>
                <hr className="col-span-2 border-gray-100 my-1" />
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedRequest?.fullname || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900 select-all">{selectedRequest?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Line Reference</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900 select-all">{selectedRequest?.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Project Scope / Details</label>
                  <p className="mt-1 text-sm text-gray-600 bg-slate-50 border p-3 rounded italic whitespace-pre-wrap">
                    {selectedRequest?.project_details || 'No project description fields provided.'}
                  </p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
                <button onClick={closeModal} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors">Close View</button>
                {!isViewOnly && (
                  <button 
                    onClick={handleSwitchToEditMode} 
                    className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Details
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
  );
}