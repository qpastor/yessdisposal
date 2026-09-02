import pool from '../config/db.js';

// -------------------------------------------------------------
// GET ROLES
// -------------------------------------------------------------
export const getRoles = async (req, res) => {
    try {
        const result = await pool.query('SELECT role_id, role_name FROM roles ORDER BY role_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Roles Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// -------------------------------------------------------------
// GET STATUSES
// -------------------------------------------------------------
export const getStatuses = async (req, res) => {
    try {
        const result = await pool.query('SELECT status_id, status_name FROM status ORDER BY status_id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Statuses Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// -------------------------------------------------------------
// GET JOB SITES
// -------------------------------------------------------------
export const getJobSites = async (req, res) => {
    try {
        const result = await pool.query('SELECT job_site_id, job_site_name FROM job_sites ORDER BY job_site_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Database Error on /job-sites:", err.message, err.stack); 
        res.status(500).json({ error: "Internal Server Database Error", details: err.message });
    }
};

// -------------------------------------------------------------
// GET CUSTOMERS
// -------------------------------------------------------------
export const getCustomers = async (req, res) => {
    try {
        const result = await pool.query('SELECT customer_id, customer_name FROM customers ORDER BY customer_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Database Error on /customers:", err.message, err.stack); 
        res.status(500).json({ error: "Internal Server Database Error", details: err.message });
    }
};

// -------------------------------------------------------------
// GET TRUCKERS
// -------------------------------------------------------------
export const getTruckers = async (req, res) => {
    try {
        const result = await pool.query('SELECT trucker_id, trucker_name FROM trucker ORDER BY trucker_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Database Error on /truckers:", err.message, err.stack); 
        res.status(500).json({ error: "Internal Server Database Error", details: err.message });
    }
};

// -------------------------------------------------------------
// GET MATERIALS
// -------------------------------------------------------------
export const getMaterials = async (req, res) => {
    try {
        const result = await pool.query('SELECT material_id, material_name FROM materials ORDER BY material_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Materials Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// -------------------------------------------------------------
// GET DUMP FACILITIES
// -------------------------------------------------------------
export const getDumpFacilities = async (req, res) => {
    try {
        const result = await pool.query('SELECT dump_facility_id, dump_facility_name FROM dump_facility ORDER BY dump_facility_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Dump Facilities Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// -------------------------------------------------------------
// GET TASK STATUS STATS (FOR DASHBOARD)
// -------------------------------------------------------------
export const getTaskStats = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                s.status_name, 
                COUNT(t.task_id) as count 
            FROM status s 
            LEFT JOIN tasks t ON s.status_id = t.status_id 
            GROUP BY s.status_name
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Task Stats Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};