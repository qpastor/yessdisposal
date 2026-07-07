import React, { useState, useEffect } from 'react';
import { Search, Download, UserPlus, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance
import Modal from '../components/ui/Modal'; // Import the Modal component

export default function Masterlist({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [statuses, setStatuses] = useState([]);

  // --- Modal Control States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', or 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --- Form State for Adding/Editing Tasks ---
  const [formData, setFormData] = useState({
    status_id: '', 
    schedule_date: '',
    job_site: '',
    customer: '',
    loads: '',
    material: '',
    trucker: '',
    dump_facility: '',
    remarks: '',
    completed_date: '',
    actual_loads: '',
    yess_invoice: '',
    trucker_invoice: '',
    dump_facility_invoice: ''
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
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/api/auth/tasks');
      if (response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      } else {
        setTasks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Fetch Statuses for Dropdown ---
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await instance.get('/api/auth/statuses');
        setStatuses(response.data);
        
        // Automatically set the default status_id to the first status in the list
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, status_id: response.data[0].status_id }));
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    
    fetchStatuses();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.status_name?.toLowerCase().includes(query) ||
      task.job_site?.toLowerCase().includes(query) ||
      task.customer?.toLowerCase().includes(query) ||
      task.trucker?.toLowerCase().includes(query) ||
      task.material?.toLowerCase().includes(query) ||
      task.yess_invoice?.toString().includes(query)
    );
  });

  const handleExportExcel = async () => {
    try {
      const response = await instance.get('/api/auth/tasks/export-excel', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Masterlist.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Failed to export Excel file.");
    }
  };

  // --- Trigger View Details Modal ---
  const viewTask = async (id) => {
    setModalMode('view');
    setModalLoading(true);
    setIsModalOpen(true);
    try {
      const response = await instance.get(`/api/auth/tasks/${id}`);
      setSelectedTask(response.data);
    } catch (err) {
      console.error("Error fetching task details:", err);
      alert("Failed to fetch task details.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Transition from View to Edit mode ---
  const handleSwitchToEditMode = () => {
    if (!selectedTask) return;
    
    // Format dates to YYYY-MM-DD format for standard HTML date inputs
    const formatInputDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toISOString().split('T')[0];
    };

    setFormData({
      status_id: selectedTask.status_id || '',
      schedule_date: formatInputDate(selectedTask.schedule_date),
      job_site: selectedTask.job_site || '',
      customer: selectedTask.customer || '',
      loads: selectedTask.loads || '',
      material: selectedTask.material || '',
      trucker: selectedTask.trucker || '',
      dump_facility: selectedTask.dump_facility || '',
      remarks: selectedTask.remarks || '',
      completed_date: formatInputDate(selectedTask.completed_date),
      actual_loads: selectedTask.actual_loads || '',
      yess_invoice: selectedTask.yess_invoice || selectedTask.invoice || '',
      trucker_invoice: selectedTask.trucker_invoice || '',
      dump_facility_invoice: selectedTask.dump_facility_invoice || ''
    });

    setModalMode('edit');
  };

  // --- Trigger Add Task Modal ---
  const handleOpenAddTaskModal = () => {
    setModalMode('add');
    setFormData({
      status_id: statuses.length > 0 ? statuses[0].status_id : '',
      schedule_date: '',
      job_site: '',
      customer: '',
      loads: '',
      material: '',
      trucker: '',
      dump_facility: '',
      remarks: '',
      completed_date: '',
      actual_loads: '',
      yess_invoice: '',
      trucker_invoice: '',
      dump_facility_invoice: ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Unified Form Submit Handler (Handles Add or Edit contexts) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let taskId = selectedTask?.task_id;

      if (modalMode === 'add') {
        const response = await instance.post('/api/auth/task-register', formData); 
        taskId = response.data?.task?.task_id || response.data?.task_id;
      } else if (modalMode === 'edit') {
        await instance.put(`/api/auth/tasks/${taskId}`, formData);
      }

      await fetchTasks(); 

      if (taskId) {
        const detailsResponse = await instance.get(`/api/auth/tasks/${taskId}`);
        setSelectedTask(detailsResponse.data);
        setModalMode('view');
      } else {
        setIsModalOpen(false);
        setSelectedTask(null);
      }
    } catch (err) {
      console.error(`Error saving task in ${modalMode} mode:`, err);
      alert(`Failed to save data context properties in ${modalMode} operational mode.`);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredTasks.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredTasks.length / recordsPerPage);

  if (loading) return <div className="p-10 text-center">Loading tasks...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Status</label>
        <select 
          name="status_id"
          value={formData.status_id} 
          onChange={handleInputChange}
          className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
        >
          {statuses.map((status) => (
            <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Scheduled Date</label>
        <input 
          type="date" required name="schedule_date" value={formData.schedule_date} onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <hr className="col-span-2 border-gray-100 my-1" />
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Customer</label>
        <input 
          type="text" required name="customer" value={formData.customer} onChange={handleInputChange} placeholder="Client Name"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Job Site</label>
        <input 
          type="text" required name="job_site" value={formData.job_site} onChange={handleInputChange} placeholder="Coordinates or Street"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Materials</label>
        <input 
          type="text" required name="material" value={formData.material} onChange={handleInputChange} placeholder="e.g. Dirt, Gravel, Concrete"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Loads</label>
        <input 
          type="number" required name="loads" value={formData.loads} onChange={handleInputChange} placeholder="0"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Trucker</label>
        <input 
          type="text" required name="trucker" value={formData.trucker} onChange={handleInputChange} placeholder="Hauler Company/Driver"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Dump Facility</label>
        <input 
          type="text" required name="dump_facility" value={formData.dump_facility} onChange={handleInputChange} placeholder="Disposal Site Name"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Remarks</label>
        <textarea 
          name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange} placeholder="Add route instructions or details..."
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />
      </div>
      <hr className="col-span-2 border-gray-100 my-1" />
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Completed Date</label>
        <input 
          type="date" name="completed_date" value={formData.completed_date} onChange={handleInputChange} 
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Actual Loads</label>
        <input 
          type="number" name="actual_loads" value={formData.actual_loads} onChange={handleInputChange} placeholder="0"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <hr className="col-span-2 border-gray-100 my-1" />
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Yess Invoice</label>
        <input 
          type="text" name="yess_invoice" value={formData.yess_invoice} onChange={handleInputChange} placeholder="Yess Invoice"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Trucker Invoice</label>
        <input 
          type="text" name="trucker_invoice" value={formData.trucker_invoice} onChange={handleInputChange} placeholder="Trucker Invoice"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Dump Facility Invoice</label>
        <input 
          type="text" name="dump_facility_invoice" value={formData.dump_facility_invoice} onChange={handleInputChange} placeholder="Dump Facility Invoice"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* --- Toolbar --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for Status, Job Site, Customer, Trucker, Material, or Yess Invoice"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
          </div>         
            
          <div className="flex items-center gap-3">
            {!isViewOnly && (
              <>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600"
                >
                  <Download className="w-4 h-4" /> Export All
                </button>
                <button 
                  onClick={handleOpenAddTaskModal} 
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700"
                >
                  <UserPlus className="w-4 h-4"/> Add Task
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- Table Container --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D3E50] text-white text-sm font-medium tracking-wide select-none">
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Schedule Date</th>
                <th className="p-4 font-semibold">Job Site</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Loads</th>
                <th className="p-4 font-semibold">Material</th>
                <th className="p-4 font-semibold">Trucker</th>
                <th className="p-4 font-semibold">Dump Facility</th>
                <th className="p-4 font-semibold">Yess Invoice</th>
                <th className="p-4 font-semibold rounded-tr-xl">Notes</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm divide-y divide-gray-100">
              {currentRecords.length > 0 ? (
                currentRecords.map((task, index) => (
                  <tr 
                    key={task.task_id || index} 
                    onClick={() => viewTask(task.task_id)}
                    className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">{task.status_name}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {new Date(task.schedule_date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-gray-700">{task.job_site}</td>
                    <td className="p-4 text-gray-700">{task.customer}</td>
                    <td className="p-4 text-gray-700">{task.loads}</td>
                    <td className="p-4 text-gray-700">{task.material}</td>
                    <td className="p-4 text-gray-700">{task.trucker}</td>
                    <td className="p-4 text-gray-700">{task.dump_facility}</td>
                    <td className="p-4 text-gray-700">{task.invoice || <span className="text-slate-500 italic">No Invoice</span>}</td>
                    <td className="p-4 text-gray-700 max-w-xs truncate">{task.remarks || <span className="text-slate-500 italic">N/A</span>}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="100%" className="p-10 text-center text-slate-500 italic">No results found for "{searchQuery}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Controls --- */}
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{indexOfFirstRecord + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(indexOfLastRecord, filteredTasks.length)}</span> of{" "}
            <span className="font-semibold">{filteredTasks.length}</span> entries
          </p>
          
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className={`p-2 rounded-md border ${currentPage === 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 border-gray-300'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center px-4 text-sm font-medium">Page {currentPage} of {totalPages || 1}</div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className={`p-2 rounded-md border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 border-gray-300'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Conditional Polymorphic Modal Layout --- */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          sizeClass="max-w-2xl"
          title={modalMode === 'add' ? "Register New Task" : modalMode === 'edit' ? `Edit Task — Reference ID: #${selectedTask?.task_id || ''}` : `Task Details — Reference ID: #${selectedTask?.task_id || ''}`}
        >
          {modalLoading ? (
            <div className="p-10 text-center text-sm text-gray-500 font-medium">Processing dispatch operation pipeline...</div>
          ) : modalMode === 'add' || modalMode === 'edit' ? (
            /* ==================== FORM (ADD & EDIT MODE) ==================== */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {renderFormFields()}
              <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                <button 
                  type="button" 
                  onClick={modalMode === 'edit' ? () => setModalMode('view') : closeModal} 
                  className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 text-gray-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700">
                  {modalMode === 'add' ? 'Save New Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* ==================== VIEW MODE LAYOUT ==================== */
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wider">Status</label>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedTask?.status_name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedTask?.schedule_date)}</p>
                </div>
                <hr className="col-span-3 border-gray-100 my-1" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Job Site</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.job_site || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.customer || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.material || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Loads</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.loads || 0}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Trucker</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.trucker || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dump Facility</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.dump_facility || 'N/A'}</p>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</label>
                  <p className="mt-1 text-sm text-gray-600 bg-slate-50 border p-2.5 rounded italic whitespace-pre-wrap">
                    {selectedTask?.remarks || 'No additional internal text remarks recorded.'}
                  </p>
                </div>
                <hr className="col-span-3 border-gray-100 my-1" />
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedTask?.completed_date)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Loads</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.actual_loads || <span className="text-gray-400">0</span>}</p>
                </div>
                <hr className="col-span-3 border-gray-100 my-1" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Yess Invoice Ref</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.invoice || selectedTask?.yess_invoice || <span className="text-gray-400">—</span>}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Trucker Invoice Ref</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.trucker_invoice || <span className="text-gray-400">—</span>}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dump Facility Invoice</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.dump_facility_invoice || <span className="text-gray-400">—</span>}</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
                <button onClick={closeModal} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors">Close View</button>
                {!isViewOnly && (
                  <button 
                    onClick={handleSwitchToEditMode} 
                    className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Task
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
  );
}