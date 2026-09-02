import React, { useState, useEffect } from 'react';
import { Search, Download, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance
import Modal from '../components/ui/Modal'; // Import the Modal component

export default function Masterlist({ user = {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [statuses, setStatuses] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [truckerList, setTruckerList] = useState([]);
  const [dumpFacilityList, setdumpfacilityList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [jobsiteList, setJobsiteList] = useState([]);

  // --- Modal Control States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', or 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --- Form State for Adding/Editing Tasks ---
  const [formData, setFormData] = useState({
    status_id: '', 
    schedule_date: '',
    customer_id: '',
    job_site_id: '',
    material_id: '',
    trucker_id: '',
    dump_facility_id: '',
    loads: '',
    remarks: '',
    completed_date: '',
    actual_loads: '',
    invoice: '',
    trucker_invoice: '',
    dump_facility_invoice: ''
  });

  // --- Flexible Role Permissions ---
  const userRole = (user?.role || user?.role_name || user?.role_id || '').toString().toLowerCase();

  const isAdmin = userRole === 'admin' || userRole === '1';
  const isFieldManager = userRole === 'field manager' || userRole === '2';
  const isViewOnly = userRole === 'view only' || userRole === '3';

  // Only Admin can Export
  const canExport = isAdmin;
  // Admin & Field Manager can Add or Edit Tasks
  const canAddTask = isAdmin || isFieldManager || !isViewOnly;
  const canEditTask = isAdmin || isFieldManager || !isViewOnly;

  // Helper to normalize backend response data (arrays vs object-wrapped lists)
  const extractArray = (resData, key) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (key && Array.isArray(resData[key])) return resData[key];
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-gray-400">N/A</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/api/auth/tasks');
      setTasks(extractArray(response.data, 'tasks'));
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeMasterlistData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use Promise.allSettled so one failing endpoint doesn't break the entire page
        const results = await Promise.allSettled([
          instance.get('/api/auth/tasks'),
          instance.get('/api/auth/customers'),
          instance.get('/api/auth/truckers'),
          instance.get('/api/auth/materials'),
          instance.get('/api/auth/dump-facilities'),
          instance.get('/api/auth/statuses'),
          instance.get('/api/auth/job-sites')
        ]);

        const [
          tasksRes, 
          customerRes, 
          truckerRes, 
          materialsRes, 
          dumpFacilityRes, 
          statusRes, 
          jobsiteRes
        ] = results;

        // Extract tasks safely
        if (tasksRes.status === 'fulfilled') {
          setTasks(extractArray(tasksRes.value.data, 'tasks'));
        } else {
          console.error("Failed to fetch tasks:", tasksRes.reason);
          setError("Failed to load tasks list.");
        }

        // Safely set lookup lists (fallback to [] if endpoint fails)
        const customerData = customerRes.status === 'fulfilled' ? extractArray(customerRes.value.data, 'customers') : [];
        const truckerData = truckerRes.status === 'fulfilled' ? extractArray(truckerRes.value.data, 'truckers') : [];
        const materialsData = materialsRes.status === 'fulfilled' ? extractArray(materialsRes.value.data, 'materials') : [];
        const dumpFacilityData = dumpFacilityRes.status === 'fulfilled' ? extractArray(dumpFacilityRes.value.data, 'dumpFacilities') : [];
        const statusData = statusRes.status === 'fulfilled' ? extractArray(statusRes.value.data, 'statuses') : [];
        const jobsiteData = jobsiteRes.status === 'fulfilled' ? extractArray(jobsiteRes.value.data, 'jobSites') : [];

        setCustomerList(customerData);
        setTruckerList(truckerData);
        setMaterialsList(materialsData);
        setdumpfacilityList(dumpFacilityData);
        setStatuses(statusData);
        setJobsiteList(jobsiteData);

        if (statusData.length > 0) {
          setFormData(prev => ({ ...prev, status_id: statusData[0].status_id }));
        }

      } catch (err) {
        setError("Failed to initialize masterlist datasets.");
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeMasterlistData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.status_name?.toLowerCase().includes(query) ||
      task.job_site_name?.toLowerCase().includes(query) ||
      task.customer_name?.toLowerCase().includes(query) ||
      task.trucker_name?.toLowerCase().includes(query) ||
      task.material_name?.toLowerCase().includes(query) ||
      task.invoice?.toString().includes(query)
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

  const handleSwitchToEditMode = () => {
    if (!selectedTask) return;
    
    const formatInputDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toISOString().split('T')[0];
    };

    setFormData({
      status_id: selectedTask.status_id || '',
      schedule_date: formatInputDate(selectedTask.schedule_date),
      customer_id: selectedTask.customer_id || '',
      job_site_id: selectedTask.job_site_id || '',
      material_id: selectedTask.material_id || '',
      trucker_id: selectedTask.trucker_id || '',
      dump_facility_id: selectedTask.dump_facility_id || '',
      loads: selectedTask.loads ?? '',
      remarks: selectedTask.remarks || '',
      completed_date: formatInputDate(selectedTask.completed_date),
      actual_loads: selectedTask.actual_loads ?? '',
      invoice: selectedTask.invoice || '',
      trucker_invoice: selectedTask.trucker_invoice || '',
      dump_facility_invoice: selectedTask.dump_facility_invoice || ''
    });

    setModalMode('edit');
  };

  const handleOpenAddTaskModal = () => {
    setSelectedTask(null);
    setModalMode('add');
    setFormData({
      status_id: statuses.length > 0 ? statuses[0].status_id : '',
      schedule_date: '',
      customer_id: '',
      job_site_id: '',
      material_id: '',
      trucker_id: '',
      dump_facility_id: '',
      loads: '',
      remarks: '',
      completed_date: '',
      actual_loads: '',
      invoice: '',
      trucker_invoice: '',
      dump_facility_invoice: ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setModalLoading(true);
    try {
      let taskId = selectedTask?.task_id;

      // Clean payload: converting empty strings to null for PostgreSQL compatibility
      const cleanedPayload = Object.keys(formData).reduce((acc, key) => {
        const val = formData[key];
        if (val === "" || val === undefined) {
          acc[key] = null;
        } else {
          acc[key] = typeof val === 'string' ? val.trim() : val;
        }
        return acc;
      }, {});

      if (modalMode === 'add') {
        const response = await instance.post('/api/auth/task-register', cleanedPayload); 
        taskId = response.data?.task?.task_id || response.data?.task_id;
      } else if (modalMode === 'edit') {
        await instance.put(`/api/auth/tasks/${taskId}`, cleanedPayload);
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
      alert(`Failed to save data in ${modalMode} mode.`);
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

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading tasks...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Status</label>
        <select 
          name="status_id"
          value={formData.status_id} 
          onChange={handleInputChange}
          className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all cursor-pointer"
        >
          {statuses.map((status) => (
            <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
          ))}
        </select>
      </div>

      {/* Scheduled Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Scheduled Date</label>
        <input 
          type="date" required name="schedule_date" value={formData.schedule_date} onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <hr className="col-span-2 border-gray-100 my-1" />
      
      {/* Customer */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Customer</label>
        <select
          required
          name="customer_id"
          value={formData.customer_id} 
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
        >
          <option value="">Select a Client</option>
          {Array.isArray(customerList) && customerList.length > 0 ? (
            customerList.map((item) => (
              <option key={item.customer_id} value={item.customer_id}>
                {item.customer_name}
              </option>
            ))
          ) : (
            <option disabled>No customers available</option>
          )}
        </select>
      </div>

      {/* Job Site */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Job Site</label>
        <select
          required
          name="job_site_id"
          value={formData.job_site_id} 
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
        >
          <option value="">Select a Job Site</option>
          {Array.isArray(jobsiteList) && jobsiteList.length > 0 ? (
            jobsiteList.map((item) => (
              <option key={item.job_site_id} value={item.job_site_id}>
                {item.job_site_name}
              </option>
            ))
          ) : (
            <option disabled>No job sites available</option>
          )}
        </select>
      </div>
      
      {/* Material */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Material</label>
        <select
          required
          name="material_id"
          value={formData.material_id} 
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
        >
          <option value="">Select a Material</option>
          {Array.isArray(materialsList) && materialsList.length > 0 ? (
            materialsList.map((item) => (
              <option key={item.material_id} value={item.material_id}>
                {item.material_name}
              </option>
            ))
          ) : (
            <option disabled>No materials available</option>
          )}
        </select>
      </div>

      {/* Loads */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Loads</label>
        <input 
          type="number" min="0" required name="loads" value={formData.loads} onChange={handleInputChange} placeholder="0"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Trucker */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Trucker</label>
        <select
          required
          name="trucker_id"
          value={formData.trucker_id} 
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
        >
          <option value="">Select a Trucker</option>
          {Array.isArray(truckerList) && truckerList.length > 0 ? (
            truckerList.map((item) => (
              <option key={item.trucker_id} value={item.trucker_id}>
                {item.trucker_name}
              </option>
            ))
          ) : (
            <option disabled>No truckers available</option>
          )}
        </select>
      </div>

      {/* Dump Facility */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Dump Facility</label>
        <select
          required
          name="dump_facility_id"
          value={formData.dump_facility_id} 
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
        >
          <option value="">Select a Dump Facility</option>
          {Array.isArray(dumpFacilityList) && dumpFacilityList.length > 0 ? (
            dumpFacilityList.map((item) => (
              <option key={item.dump_facility_id} value={item.dump_facility_id}>
                {item.dump_facility_name}
              </option>
            ))
          ) : (
            <option disabled>No dump facilities available</option>
          )}
        </select>
      </div>
      
      {/* Remarks */}
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Remarks</label>
        <textarea 
          name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange} placeholder="Add more information"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      <hr className="col-span-2 border-gray-100 my-1" />

      {/* Completed Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Completed Date</label>
        <input 
          type="date" name="completed_date" value={formData.completed_date} onChange={handleInputChange} 
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Actual Loads */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Actual Loads</label>
        <input 
          type="number" name="actual_loads" value={formData.actual_loads} onChange={handleInputChange} placeholder="0"
          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <hr className="col-span-2 border-gray-100 my-1" />

      {/* Invoices */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Yess Invoice</label>
        <input 
          type="text" name="invoice" value={formData.invoice} onChange={handleInputChange} placeholder="Yess Invoice"
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Search Bar Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
        </div>         
          
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Export Button: Only visible to Admins */}
          {canExport && (
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600 border-gray-300"
            >
              <Download className="w-4 h-4" /> Export All
            </button>
          )}

          {/* Add Task Button: Visible to Admin and Field Manager */}
          {canAddTask && (
            <button 
              onClick={handleOpenAddTaskModal} 
              className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <UserPlus className="w-4 h-4"/> Add Task
            </button>
          )}
        </div>
      </div>

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
                    {formatDate(task.schedule_date)}
                  </td>
                  <td className="p-4 text-gray-700">{task.job_site_name}</td>
                  <td className="p-4 text-gray-700">{task.customer_name}</td>
                  <td className="p-4 text-gray-700">{task.loads}</td>
                  <td className="p-4 text-gray-700">{task.material_name}</td>
                  <td className="p-4 text-gray-700">{task.trucker_name}</td>
                  <td className="p-4 text-gray-700">{task.dump_facility_name}</td>
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

      <div className="flex items-center justify-between mt-6 px-2">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold">{filteredTasks.length > 0 ? indexOfFirstRecord + 1 : 0}</span> to{" "}
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        sizeClass="max-w-2xl"
        title={modalMode === 'add' ? "Register New Task" : modalMode === 'edit' ? `Edit Task — Reference ID: #${selectedTask?.task_id || ''}` : `Task Details — Reference ID: #${selectedTask?.task_id || ''}`}
      >
        {modalLoading ? (
          <div className="p-10 text-center text-sm text-gray-500 font-medium">Processing operation...</div>
        ) : modalMode === 'add' || modalMode === 'edit' ? (
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
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
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
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.job_site_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.customer_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.material_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Loads</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.loads || 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Trucker</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.trucker_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dump Facility</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.dump_facility_name || 'N/A'}</p>
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</label>
                <p className="mt-1 text-sm text-gray-600">{selectedTask?.remarks || 'N/A'}</p>
              </div>

              <hr className="col-span-3 border-gray-100 my-1" />

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedTask?.completed_date)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Loads</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.actual_loads ?? 'N/A'}</p>
              </div>

              <hr className="col-span-3 border-gray-100 my-1" />

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Yess Invoice</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.invoice || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Trucker Invoice</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.trucker_invoice || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dump Facility Invoice</label>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTask?.dump_facility_invoice || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 text-gray-600"
              >
                Close
              </button>
              {canEditTask && (
                <button 
                  type="button" 
                  onClick={handleSwitchToEditMode} 
                  className="px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700"
                >
                  Edit Task
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}