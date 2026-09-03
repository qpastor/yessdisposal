import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Download, UserPlus, ChevronLeft, ChevronRight, Check, X, ChevronDown } from 'lucide-react';
import instance from '../api'; 
import Modal from '../components/ui/Modal'; 

// --- Photon Normalization Map & Helper ---
const SUFFIX_MAP = {
  STREET: 'ST',
  AVENUE: 'AVE',
  BOULEVARD: 'BLVD',
  ROAD: 'RD',
  DRIVE: 'DR',
  LANE: 'LN',
  COURT: 'CT',
  SUITE: 'STE',
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W'
};

function formatAddressString(houseNumber, streetName) {
  if (!streetName) return '';
  const rawCombined = `${houseNumber ? houseNumber + ' ' : ''}${streetName}`.trim().toUpperCase();
  return rawCombined
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => SUFFIX_MAP[word] || word)
    .join(' ');
}

// --- Reusable Photon Job Site Autocomplete Component ---
function JobSitePhotonInput({ value, onChange, hasError, placeholder = "Type job site..." }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const nyBbox = "-79.7628,40.4961,-71.8562,45.0158";
        const nyLat = "40.7128";
        const nyLon = "-74.0060";

        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&limit=5&lat=${nyLat}&lon=${nyLon}&bbox=${nyBbox}`
        );
        const data = await response.json();

        const filteredFeatures = (data.features || []).filter((feature) => {
          const country = feature.properties?.countrycode || feature.properties?.country;
          if (!country) return true;
          return country.toLowerCase() === 'us' || country.toLowerCase() === 'united states';
        });

        const formattedResults = filteredFeatures.map((feature) => {
          const props = feature.properties || {};
          const houseNumber = props.housenumber || '';
          const streetName = props.street || props.name || '';
          
          const normalizedSiteName = formatAddressString(houseNumber, streetName);
          const cityState = [props.city || props.town, props.state, props.postcode].filter(Boolean).join(', ');

          return {
            id: props.osm_id || Math.random().toString(),
            siteName: normalizedSiteName || trimmedQuery.toUpperCase(),
            fullAddress: `${normalizedSiteName}${cityState ? `, ${cityState}` : ''}`
          };
        });

        setSuggestions(formattedResults);
        setIsOpen(formattedResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching address data from Photon:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const cleanName = item.siteName || query.toUpperCase();
    setQuery(cleanName);
    setIsOpen(false);
    onChange(cleanName);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 ${
            hasError
              ? 'border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500 bg-white'
          }`}
        />
        {isLoading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            ...
          </span>
        )}
      </div>

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto z-50 shadow-lg p-0 m-0 list-none">
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2 cursor-pointer border-b last:border-b-0 border-gray-100 ${
                  isSelected ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-xs text-gray-800">{item.siteName}</div>
                <div className="text-[10px] text-gray-500 truncate">{item.fullAddress}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Masterlist({ user = {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusState, setStatusState] = useState({});
  const RECORDS_PER_STATUS_PAGE = 5;

  const [statuses, setStatuses] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [truckerList, setTruckerList] = useState([]);
  const [dumpFacilityList, setdumpfacilityList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [jobsiteList, setJobsiteList] = useState([]);

  const [newJobSiteText, setNewJobSiteText] = useState("");
  const [editJobSiteText, setEditJobSiteText] = useState("");

  const getLocalTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isAddingRow, setIsAddingRow] = useState(false);
  const [savingNewRow, setSavingNewRow] = useState(false);
  const [inlineErrors, setInlineErrors] = useState({});
  const [newRowData, setNewRowData] = useState({
    status_id: '',
    schedule_date: getLocalTodayDate(),
    customer_id: '',
    job_site_id: '',
    material_id: '',
    loads: '',
    trucker_id: '',
    dump_facility_id: '',
    invoice: '',
    remarks: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  const userRole = (user?.role || user?.role_name || user?.role_id || '').toString().toLowerCase();

  const isAdmin = userRole === 'admin' || userRole === '1';
  const isFieldManager = userRole === 'field manager' || userRole === '2';
  const isViewOnly = userRole === 'view only' || userRole === '3';

  const canExport = isAdmin;
  const canAddTask = isAdmin || isFieldManager || !isViewOnly;
  const canEditTask = isAdmin || isFieldManager || !isViewOnly;

  const extractArray = (resData, key) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (key && Array.isArray(resData[key])) return resData[key];
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-gray-400">N/A</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const resolveOrCreateJobSite = async (inputtedName) => {
    if (!inputtedName || !inputtedName.trim()) return null;

    const trimmed = inputtedName.trim();
    const existing = jobsiteList.find(
      (j) => j.job_site_name?.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      return existing.job_site_id;
    }

    const response = await instance.post('/api/auth/tasks/job-sites', {
      job_site_name: trimmed
    });

    const newJobSite = response.data?.jobSite || response.data;
    const newId = newJobSite.job_site_id;

    setJobsiteList((prev) => [...prev, newJobSite]);
    return newId;
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

        if (tasksRes.status === 'fulfilled') {
          setTasks(extractArray(tasksRes.value.data, 'tasks'));
        } else {
          console.error("Failed to fetch tasks:", tasksRes.reason);
          setError("Failed to load tasks list.");
        }

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
          setNewRowData(prev => ({ ...prev, status_id: statusData[0].status_id }));
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

  const orderedGroupedTasks = useMemo(() => {
    const rawGroups = filteredTasks.reduce((acc, task) => {
      const statusName = task.status_name || 'Unassigned';
      if (!acc[statusName]) acc[statusName] = [];
      acc[statusName].push(task);
      return acc;
    }, {});

    const ordered = [];

    statuses.forEach((statusObj) => {
      const name = statusObj.status_name;
      if (rawGroups[name] && rawGroups[name].length > 0) {
        ordered.push([name, rawGroups[name]]);
        delete rawGroups[name];
      }
    });

    Object.entries(rawGroups).forEach(([name, tasksList]) => {
      if (tasksList.length > 0) {
        ordered.push([name, tasksList]);
      }
    });

    return ordered;
  }, [filteredTasks, statuses]);

  const getStatusPage = (statusName) => statusState[statusName]?.currentPage || 1;
  const isStatusCollapsed = (statusName) => Boolean(statusState[statusName]?.collapsed);

  const setStatusPage = (statusName, newPage) => {
    setStatusState(prev => ({
      ...prev,
      [statusName]: {
        ...prev[statusName],
        currentPage: newPage
      }
    }));
  };

  const toggleStatusCollapse = (statusName) => {
    setStatusState(prev => ({
      ...prev,
      [statusName]: {
        ...prev[statusName],
        collapsed: !prev[statusName]?.collapsed
      }
    }));
  };

  const handleAddTaskClick = () => {
    setInlineErrors({});
    setNewJobSiteText("");
    setNewRowData(prev => ({
      ...prev,
      schedule_date: getLocalTodayDate(),
      status_id: prev.status_id || (statuses.length > 0 ? statuses[0].status_id : '')
    }));
    setIsAddingRow(true);
  };

  const handleInlineInputChange = (e) => {
    const { name, value } = e.target;
    setNewRowData(prev => ({ ...prev, [name]: value }));
    
    if (inlineErrors[name]) {
      setInlineErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSaveNewTask = async () => {
    if (!canAddTask) {
      alert("Unauthorized: Your account does not have permission to add tasks.");
      return;
    }

    const errors = {};
    if (!newRowData.schedule_date) errors.schedule_date = "Required";
    if (!newJobSiteText.trim()) errors.job_site_id = "Required";
    if (newRowData.loads === '' || newRowData.loads === null || newRowData.loads === undefined) errors.loads = "Required";
    if (!newRowData.material_id) errors.material_id = "Required";
    if (!newRowData.trucker_id) errors.trucker_id = "Required";
    if (!newRowData.dump_facility_id) errors.dump_facility_id = "Required";

    if (Object.keys(errors).length > 0) {
      setInlineErrors(errors);
      return;
    }

    setSavingNewRow(true);

    try {
      const finalJobSiteId = await resolveOrCreateJobSite(newJobSiteText);

      const cleanedPayload = Object.keys(newRowData).reduce((acc, key) => {
        const val = newRowData[key];
        if (val === "" || val === undefined) {
          acc[key] = null;
        } else {
          acc[key] = typeof val === 'string' ? val.trim() : val;
        }
        return acc;
      }, {});

      cleanedPayload.job_site_id = finalJobSiteId;

      await instance.post('/api/auth/task-register', cleanedPayload);
      setIsAddingRow(false);
      setInlineErrors({});
      setNewJobSiteText("");
      setNewRowData({
        status_id: statuses.length > 0 ? statuses[0].status_id : '',
        schedule_date: getLocalTodayDate(),
        customer_id: '',
        job_site_id: '',
        material_id: '',
        loads: '',
        trucker_id: '',
        dump_facility_id: '',
        invoice: '',
        remarks: ''
      });
      await fetchTasks();
    } catch (err) {
      console.error("Error creating inline task:", err.response?.data || err.message);
      alert(`Failed to create task: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingNewRow(false);
    }
  };

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
      if (isNaN(d.getTime())) return '';
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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

    setEditJobSiteText(selectedTask.job_site_name || '');
    setModalMode('edit');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const taskId = selectedTask?.task_id;
      const finalJobSiteId = await resolveOrCreateJobSite(editJobSiteText);

      const cleanedPayload = Object.keys(formData).reduce((acc, key) => {
        const val = formData[key];
        if (val === "" || val === undefined) {
          acc[key] = null;
        } else {
          acc[key] = typeof val === 'string' ? val.trim() : val;
        }
        return acc;
      }, {});

      cleanedPayload.job_site_id = finalJobSiteId;

      if (modalMode === 'edit') {
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

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading tasks...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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
          
        <div className="flex items-center gap-3">
          {canExport && (
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600 border-gray-300"
            >
              <Download className="w-4 h-4" /> Export All
            </button>
          )}

          {canAddTask && (
            <button 
              onClick={handleAddTaskClick} 
              disabled={isAddingRow}
              className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <UserPlus className="w-4 h-4"/> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Container for Sticky Header without Horizontal Scroll */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto border rounded-lg border-gray-200">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10 bg-[#2D3E50] text-white text-xs font-medium tracking-wide select-none shadow">
            <tr>
              <th className="p-2.5 font-semibold w-[9%]">Status</th>
              <th className="p-2.5 font-semibold w-[10%]">Date</th>
              <th className="p-2.5 font-semibold w-[16%]">Job Site *</th>
              <th className="p-2.5 font-semibold w-[11%]">Customer</th>
              <th className="p-2.5 font-semibold w-[5%] text-center">Loads*</th>
              <th className="p-2.5 font-semibold w-[10%]">Material *</th>
              <th className="p-2.5 font-semibold w-[10%]">Trucker *</th>
              <th className="p-2.5 font-semibold w-[11%]">Dump Facility *</th>
              <th className="p-2.5 font-semibold w-[8%]">Invoice</th>
              <th className="p-2.5 font-semibold w-[10%]">Notes</th>
              <th className="p-2.5 font-semibold text-center w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-xs divide-y divide-gray-100">
            {isAddingRow && (
              <tr className="bg-blue-50/60 border-b-2 border-blue-200 align-top">
                <td className="p-1.5">
                  <select 
                    name="status_id" 
                    value={newRowData.status_id} 
                    onChange={handleInlineInputChange}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {statuses.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <input 
                    type="date" 
                    name="schedule_date" 
                    value={newRowData.schedule_date} 
                    onChange={handleInlineInputChange}
                    className={`w-full border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 ${
                      inlineErrors.schedule_date ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {inlineErrors.schedule_date && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.schedule_date}</span>}
                </td>
                <td className="p-1.5">
                  <JobSitePhotonInput 
                    value={newJobSiteText}
                    onChange={(val) => {
                      setNewJobSiteText(val);
                      if (inlineErrors.job_site_id) {
                        setInlineErrors(prev => ({ ...prev, job_site_id: null }));
                      }
                    }}
                    hasError={Boolean(inlineErrors.job_site_id)}
                    placeholder="Job site..."
                  />
                  {inlineErrors.job_site_id && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.job_site_id}</span>}
                </td>
                <td className="p-1.5">
                  <select 
                    name="customer_id" 
                    value={newRowData.customer_id} 
                    onChange={handleInlineInputChange}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled hidden>Customer</option>
                    {customerList.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <input 
                    type="number" 
                    name="loads" 
                    placeholder="0"
                    min="0" 
                    value={newRowData.loads} 
                    onChange={handleInlineInputChange}
                    className={`w-full border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 ${
                      inlineErrors.loads ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {inlineErrors.loads && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.loads}</span>}
                </td>
                <td className="p-1.5">
                  <select 
                    name="material_id" 
                    value={newRowData.material_id} 
                    onChange={handleInlineInputChange}
                    className={`w-full border rounded px-1.5 py-1 text-xs bg-white outline-none focus:ring-1 ${
                      inlineErrors.material_id ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="" disabled hidden>Material</option>
                    {materialsList.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
                  </select>
                  {inlineErrors.material_id && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.material_id}</span>}
                </td>
                <td className="p-1.5">
                  <select 
                    name="trucker_id" 
                    value={newRowData.trucker_id} 
                    onChange={handleInlineInputChange}
                    className={`w-full border rounded px-1.5 py-1 text-xs bg-white outline-none focus:ring-1 ${
                      inlineErrors.trucker_id ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="" disabled hidden>Trucker</option>
                    {truckerList.map(t => <option key={t.trucker_id} value={t.trucker_id}>{t.trucker_name}</option>)}
                  </select>
                  {inlineErrors.trucker_id && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.trucker_id}</span>}
                </td>
                <td className="p-1.5">
                  <select 
                    name="dump_facility_id" 
                    value={newRowData.dump_facility_id} 
                    onChange={handleInlineInputChange}
                    className={`w-full border rounded px-1.5 py-1 text-xs bg-white outline-none focus:ring-1 ${
                      inlineErrors.dump_facility_id ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="" disabled hidden>Dump Facility</option>
                    {dumpFacilityList.map(d => <option key={d.dump_facility_id} value={d.dump_facility_id}>{d.dump_facility_name}</option>)}
                  </select>
                  {inlineErrors.dump_facility_id && <span className="text-[10px] text-red-500 block mt-0.5">{inlineErrors.dump_facility_id}</span>}
                </td>
                <td className="p-1.5">
                  <input 
                    type="text" 
                    name="invoice" 
                    placeholder="Invoice" 
                    value={newRowData.invoice} 
                    onChange={handleInlineInputChange}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-1.5">
                  <input 
                    type="text" 
                    name="remarks" 
                    placeholder="Notes" 
                    value={newRowData.remarks} 
                    onChange={handleInlineInputChange}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="p-1.5">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={handleSaveNewTask} 
                      disabled={savingNewRow}
                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      title="Save Task"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setIsAddingRow(false);
                        setInlineErrors({});
                      }} 
                      className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {orderedGroupedTasks.length > 0 ? (
              orderedGroupedTasks.map(([statusName, statusTasks]) => {
                const currentPage = getStatusPage(statusName);
                const collapsed = isStatusCollapsed(statusName);
                const totalStatusPages = Math.ceil(statusTasks.length / RECORDS_PER_STATUS_PAGE);
                
                const startIdx = (currentPage - 1) * RECORDS_PER_STATUS_PAGE;
                const paginatedStatusTasks = statusTasks.slice(startIdx, startIdx + RECORDS_PER_STATUS_PAGE);

                return (
                  <React.Fragment key={statusName}>
                    <tr className="bg-slate-100/90 border-t border-b border-slate-200 select-none">
                      <td colSpan="11" className="py-2 px-3 font-semibold text-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleStatusCollapse(statusName)}
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors focus:outline-none"
                          >
                            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span>Status: <strong className="text-slate-900">{statusName}</strong></span>
                            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
                              {statusTasks.length} {statusTasks.length === 1 ? 'item' : 'items'}
                            </span>
                          </button>

                          {!collapsed && totalStatusPages > 1 && (
                            <div className="flex items-center gap-2 font-normal text-slate-600">
                              <span className="text-[11px]">
                                {startIdx + 1}–{Math.min(startIdx + RECORDS_PER_STATUS_PAGE, statusTasks.length)} of {statusTasks.length}
                              </span>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  disabled={currentPage === 1}
                                  onClick={() => setStatusPage(statusName, currentPage - 1)}
                                  className="p-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-medium px-1">
                                  {currentPage}/{totalStatusPages}
                                </span>
                                <button
                                  disabled={currentPage === totalStatusPages}
                                  onClick={() => setStatusPage(statusName, currentPage + 1)}
                                  className="p-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {!collapsed && paginatedStatusTasks.map((task, index) => (
                      <tr 
                        key={task.task_id || index} 
                        onClick={() => viewTask(task.task_id)}
                        className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="p-2.5 font-medium truncate" title={task.status_name}>{task.status_name}</td>
                        <td className="p-2.5 font-semibold text-gray-800 truncate">
                          {formatDate(task.schedule_date)}
                        </td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.job_site_name}>{task.job_site_name}</td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.customer_name}>{task.customer_name}</td>
                        <td className="p-2.5 text-gray-700 truncate text-center">{task.loads}</td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.material_name}>{task.material_name}</td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.trucker_name}>{task.trucker_name}</td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.dump_facility_name}>{task.dump_facility_name}</td>
                        <td className="p-2.5 text-gray-700 truncate">{task.invoice || <span className="text-slate-400 italic">None</span>}</td>
                        <td className="p-2.5 text-gray-700 truncate" title={task.remarks}>{task.remarks || <span className="text-slate-400 italic">N/A</span>}</td>
                        <td className="p-2.5 text-center text-gray-400">--</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="p-10 text-center text-slate-500 italic">No results found for "{searchQuery}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        sizeClass="max-w-2xl"
        title={modalMode === 'edit' ? `Edit Task — Reference ID: #${selectedTask?.task_id || ''}` : `Task Details — Reference ID: #${selectedTask?.task_id || ''}`}
      >
        {modalLoading ? (
          <div className="p-10 text-center text-sm text-gray-500 font-medium">Processing operation...</div>
        ) : modalMode === 'edit' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <select
                  name="customer_id"
                  value={formData.customer_id} 
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="" disabled hidden>Select a Client</option>
                  {customerList.map((item) => (
                    <option key={item.customer_id} value={item.customer_id}>{item.customer_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Job Site *</label>
                <JobSitePhotonInput 
                  value={editJobSiteText}
                  onChange={(val) => setEditJobSiteText(val)}
                  placeholder="Type or search job site..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Material *</label>
                <select
                  required
                  name="material_id"
                  value={formData.material_id} 
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="" disabled hidden>Select a Material</option>
                  {materialsList.map((item) => (
                    <option key={item.material_id} value={item.material_id}>{item.material_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Loads *</label>
                <input 
                  type="number" min="0" required name="loads" value={formData.loads} onChange={handleInputChange} placeholder="0"
                  className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Trucker *</label>
                <select
                  required
                  name="trucker_id"
                  value={formData.trucker_id} 
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="" disabled hidden>Select a Trucker</option>
                  {truckerList.map((item) => (
                    <option key={item.trucker_id} value={item.trucker_id}>{item.trucker_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Dump Facility *</label>
                <select
                  required
                  name="dump_facility_id"
                  value={formData.dump_facility_id} 
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="" hidden>Select a Dump Facility</option>
                  {dumpFacilityList.map((item) => (
                    <option key={item.dump_facility_id} value={item.dump_facility_id}>{item.dump_facility_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Remarks</label>
                <textarea 
                  name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange} placeholder="Add more information"
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
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 text-gray-600">
                Close
              </button>
              {canEditTask && (
                <button 
                  type="button" 
                  onClick={handleSwitchToEditMode} 
                  className="px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700">
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