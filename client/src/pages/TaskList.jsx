import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import instance from '../api';
import { Pencil, ChevronRight, ChevronLeft } from 'react-bootstrap-icons';
import Modal from '../components/ui/Modal'; // Import your reusable modal shell

const TaskList = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // --- Modal Control States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --- Lookup Tables for Dropdowns ---
  const [statuses, setStatuses] = useState([]);
  const [jobSites, setJobSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [truckers, setTruckers] = useState([]);
  const [dumpFacilities, setDumpFacilities] = useState([]);

  // --- Dynamic Form FormState matching your Fields ---
  const [formData, setFormData] = useState({
    status_id: '',
    schedule_date: '',
    job_site_id: '',
    customer_id: '',
    loads: '',
    material_id: '',
    trucker_id: '',
    dump_facility_id: '',
    invoice: '',
    completed_date: '',
    actual_loads: '',
    trucker_invoice: '',
    dump_facility_invoice: '',
    remarks: ''
  });

  const isViewOnly = user?.role_name === 'View Only';

  // Grab the status and page parameters from the URL
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');
  const currentPage = parseInt(queryParams.get('page') || '1', 10);

  // --- Fetch Lookup Options once when component mounts ---
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [resStatus, resSites, resCust, resMat, resTruck, resDump] = await Promise.all([
          instance.get('/api/auth/statuses'),
          instance.get('/api/auth/job-sites'),
          instance.get('/api/auth/customers'),
          instance.get('/api/auth/materials'),
          instance.get('/api/auth/truckers'),
          instance.get('/api/auth/dump-facilities')
        ]);
        
        setStatuses(resStatus.data || []);
        setJobSites(resSites.data || []);
        setCustomers(resCust.data || []);
        setMaterials(resMat.data || []);
        setTruckers(resTruck.data || []);
        setDumpFacilities(resDump.data || []);
      } catch (err) {
        console.error("Error fetching lookups tables:", err);
      }
    };

    fetchLookupData();
  }, []);

  // --- Fetch Background Task List Grid Data ---
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        params.append('page', currentPage);
        params.append('limit', ITEMS_PER_PAGE);

        const response = await instance.get(`/api/auth/tasks?${params.toString()}`);
        if (response.data && response.data.tasks) {
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages || 1);
          setTotalTasks(response.data.totalTasks || 0);
        } else {
          setTasks(Array.isArray(response.data) ? response.data : []);
          setTotalTasks(Array.isArray(response.data) ? response.data.length : 0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [statusFilter, currentPage]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // --- Fetch Specific Task Details & Launch Modal ---
  const handleViewTask = async (id) => {
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

  // --- Transition to Form Mode ---
  const handleSwitchToEditMode = () => {
    if (!selectedTask) return;

    // Fixed date formatter that strictly extracts structural components without local shifts
    const formatDateInput = (dateStr) => {
      if (!dateStr) return '';
      
      const cleanStr = String(dateStr).trim();

      if (cleanStr.includes('T')) {
        return cleanStr.split('T')[0];
      }

      if (cleanStr.includes(' ')) {
        return cleanStr.split(' ')[0];
      }

      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${year}-${month}-${day}`;
      }

      return '';
    };

    setFormData({
      status_id: selectedTask.status_id || '',
      schedule_date: formatDateInput(selectedTask.schedule_date),
      job_site_id: selectedTask.job_site_id || '',
      customer_id: selectedTask.customer_id || '',
      loads: selectedTask.loads || 0,
      material_id: selectedTask.material_id || selectedTask.materials_id || '',
      trucker_id: selectedTask.trucker_id || '',
      dump_facility_id: selectedTask.dump_facility_id || '',
      invoice: selectedTask.invoice || '',
      completed_date: formatDateInput(selectedTask.completed_date), 
      actual_loads: selectedTask.actual_loads || 0,
      trucker_invoice: selectedTask.trucker_invoice || '',
      dump_facility_invoice: selectedTask.dump_facility_invoice || '',
      remarks: selectedTask.remarks || ''
    });

    setModalMode('edit');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Submit Changes Handler ---
const handleFormSubmit = async (e) => {
  e.preventDefault();
  if (isViewOnly) {
    alert("Unauthorized: Your account has view-only permissions.");
    return;
  }

  const id = selectedTask?.task_id || selectedTask?.id;
  if (!id) {
    alert("Error: Selected task ID is missing.");
    return;
  }

  setModalLoading(true);

  // 💡 Clean empty string date fields to null before sending to backend
  const sanitizedFormData = { ...formData };
  Object.keys(sanitizedFormData).forEach((key) => {
    if (sanitizedFormData[key] === "") {
      // Check if field is likely a date field or set empty strings to null for safety
      sanitizedFormData[key] = null;
    }
  });

  try {
    // 1. Submit update with sanitized payload
    await instance.put(`/api/auth/tasks/${id}`, sanitizedFormData);

    // 2. Refresh grid task list
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    params.append('page', currentPage);
    params.append('limit', ITEMS_PER_PAGE);

    const response = await instance.get(`/api/auth/tasks?${params.toString()}`);
    if (response.data && response.data.tasks) {
      setTasks(response.data.tasks);
      setTotalPages(response.data.totalPages || 1);
      setTotalTasks(response.data.totalTasks || 0);
    }

    // 3. Refresh modal view state
    const updatedDetails = await instance.get(`/api/auth/tasks/${id}`);
    setSelectedTask(updatedDetails.data.task || updatedDetails.data);
    setModalMode('view');
  } catch (err) {
    console.error("Error updating logistics task entry:", err.response?.data || err.message);
    const errorMessage = err.response?.data?.message || err.message || "Failed to save changes.";
    alert(`Failed to save changes to the logistics entry: ${errorMessage}`);
  } finally {
    setModalLoading(false);
  }
};

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Fixed display date formatter using UTC targets to align with raw DB data strings
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return null;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC' 
    });
  };

  const startEntry = totalTasks === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endEntry = Math.min(currentPage * ITEMS_PER_PAGE, totalTasks);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {statusFilter ? `${statusFilter}` : "All Tasks"}
        </h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-sm select-none">
              <th className="p-3">Schedule Date</th>
              <th className="p-3">Job Site</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Loads</th>
              <th className="p-3">Material</th>
              <th className="p-3">Trucker</th>
              <th className="p-3">Dump Facility</th>
              <th className="p-3">Yess Invoice</th>
              <th className="p-3">Completed Date</th>
              <th className="p-3">Actual Loads</th>
              <th className="p-3">Trucker Invoice</th>
              <th className="p-3">Dump Facility Invoice</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr 
                  key={task.task_id} 
                  onClick={() => handleViewTask(task.task_id)}
                  className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-medium text-gray-900 whitespace-nowrap">{formatDateLabel(task.schedule_date)}</td>
                  <td className="p-4 text-gray-700 min-w-[150px]">{task.job_site_name}</td>
                  <td className="p-4 text-gray-700 min-w-[140px]">{task.customer_name}</td>
                  <td className="p-4 font-semibold text-gray-800 text-center">{task.loads}</td>
                  <td className="p-3 text-gray-600">{task.material_name}</td>
                  <td className="p-3 text-gray-600">{task.trucker_name}</td>
                  <td className="p-3 text-gray-600">{task.dump_facility_name}</td>
                  <td className="p-3 text-gray-600">{task.invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {task.completed_date ? formatDateLabel(task.completed_date) : <span className="text-gray-400 italic">Not Completed</span>}
                  </td>
                  <td className="p-3 text-gray-800 font-semibold text-center">{task.actual_loads || <span className="text-gray-400 font-normal">N/A</span>}</td>
                  <td className="p-3 text-gray-600">{task.trucker_invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-600">{task.dump_facility_invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-500 max-w-xs truncate">{task.remarks || <span className="text-gray-400">N/A</span>}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="p-10 text-center text-gray-500">
                  {loading ? "Loading tasks..." : "No tasks found for this status."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && tasks.length > 0 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 mt-4 border rounded-lg shadow-sm">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{startEntry}</span> to{" "}
            <span className="font-semibold text-slate-700">{endEntry}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalTasks}</span> entries
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-slate-800 select-none">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- Reusable Dialog Backdrop Shell Container --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        sizeClass="max-w-3xl"
        title={modalMode === 'edit' ? `Modify Task #${selectedTask?.task_id || ''}` : `Task Details — Task #${selectedTask?.task_id || ''}`}
      >
        {modalLoading ? (
          <div className="p-12 text-center text-sm text-gray-400 font-medium">Synchronizing records...</div>
        ) : modalMode === 'edit' ? (
          /* ==================== FORM SUBMIT CONTAINER FRAME (FIXED 2-COLUMN STRUCTURE) ==================== */
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
                <select 
                  name="status_id" value={formData.status_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Status</option>
                  {statuses.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Scheduled Date</label>
                <input 
                  type="date" required name="schedule_date" value={formData.schedule_date} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Job Site</label>
                <select 
                  name="job_site_id" value={formData.job_site_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Job Site</option>
                  {jobSites.map(j => <option key={j.job_site_id} value={j.job_site_id}>{j.job_site_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Customer</label>
                <select 
                  name="customer_id" value={formData.customer_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Material</label>
                <select 
                  name="material_id" value={formData.material_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Material</option>
                  {materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Loads</label>
                <input 
                  type="number" name="loads" value={formData.loads} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Trucker</label>
                <select 
                  name="trucker_id" value={formData.trucker_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Trucker</option>
                  {truckers.map(t => <option key={t.trucker_id} value={t.trucker_id}>{t.trucker_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Dump Facility</label>
                <select 
                  name="dump_facility_id" value={formData.dump_facility_id} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Dump Facility</option>
                  {dumpFacilities.map(d => <option key={d.dump_facility_id} value={d.dump_facility_id}>{d.dump_facility_name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 5 - Full Width Remarks */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Remarks</label>
              <textarea 
                name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="border-t border-gray-100 my-1"/> 

            {/* Row 6 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Completed Date</label>
                <input 
                  type="date" name="completed_date" value={formData.completed_date} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Actual Loads</label>
                <input 
                  type="number" name="actual_loads" value={formData.actual_loads} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 7 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Yess Invoice</label>
                <input 
                  type="text" name="invoice" value={formData.invoice} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Trucker Invoice</label>
                <input 
                  type="text" name="trucker_invoice" value={formData.trucker_invoice} onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 8 - Full Width Invoice */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Dump Facility Invoice</label>
              <input 
                type="text" name="dump_facility_invoice" value={formData.dump_facility_invoice} onChange={handleInputChange}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-4">
              <button 
                type="button" onClick={() => setModalMode('view')}
                className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700">
                Save Task Details
              </button>
            </div>
          </form>
        ) : (
          /* ==================== DISPLAY DETAIL INFO VIEW MODAL ==================== */
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Status</label>
                <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedTask?.status_name === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {selectedTask?.status_name || `ID: ${selectedTask?.status_id}`}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Target Schedule</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateLabel(selectedTask?.schedule_date) || 'Unassigned'}</p>
              </div>
              <hr className="col-span-2 border-gray-100 my-1" />
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Job Site</label>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedTask?.job_site_name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</label>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedTask?.customer_name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Materials</label>
                <p className="mt-1 text-sm text-gray-700 font-medium">{selectedTask?.material_name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Loads</label>
                <p className="mt-1 text-sm text-slate-800 font-bold">{selectedTask?.loads || 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Trucker</label>
                <p className="mt-1 text-sm text-gray-700 font-medium">{selectedTask?.trucker_name || '-'}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Dump Facility</label>
                <p className="mt-1 text-sm text-gray-700 font-medium">{selectedTask?.dump_facility_name || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Remarks</label>
                <p className="mt-1 text-sm text-gray-600 bg-slate-50 border p-3 rounded-lg italic whitespace-pre-wrap">
                  {selectedTask?.remarks || 'No detailed log remarks notes appended.'}
                </p>
              </div>
 
              {selectedTask?.completed_date && (
                <>
                  <hr className="col-span-2 border-gray-100 my-1" />
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Completed Date</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateLabel(selectedTask?.completed_date) || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Actual Loads</label>
                    <p className="mt-1 text-sm text-green-700 font-bold">{selectedTask?.actual_loads ?? '-'}</p>
                  </div>
                  <hr className="col-span-2 border-gray-100 my-1" />
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Yess Invoice</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 select-all">{selectedTask?.invoice || <span className="text-gray-300 font-normal italic">None</span>}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Trucker Invoice</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 select-all">{selectedTask?.trucker_invoice || <span className="text-gray-300 font-normal italic">None</span>}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Dump Facility Invoice</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 select-all">{selectedTask?.dump_facility_invoice || <span className="text-gray-300 font-normal italic">None</span>}</p>
                  </div>
                </>
              )}
              
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Close
              </button>
              {!isViewOnly && (
                <button 
                  onClick={handleSwitchToEditMode}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700"
                >
                  Edit Task Details
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskList;