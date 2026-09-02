import pool from '../config/db.js';

// -------------------------------------------------------------
// SUBMIT QUOTE / CONTACT REQUEST
// -------------------------------------------------------------
export const createRequest = async (req, res) => {
    try {
        const { 
            fullname,
            email,
            phone,
            project_details
        } = req.body;

        const newRequest = await pool.query(
            `INSERT INTO requests (fullname, email, phone, project_details) 
             VALUES($1, $2, $3, $4) 
             RETURNING *`,
            [fullname, email, phone, project_details]
        );

        res.status(201).json(newRequest.rows[0]);

    } catch (err) {
        console.error("Create Request Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// GET ALL REQUESTS
// -------------------------------------------------------------
export const getAllRequests = async (req, res) => {
    try {
        const queryText = `SELECT * FROM requests ORDER BY created_at DESC`;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Requests Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// GET REQUEST BY ID
// -------------------------------------------------------------
export const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await pool.query(
            'SELECT * FROM requests WHERE request_id = $1',
            [id]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: "Request not found" });
        }

        res.json(request.rows[0]);
    } catch (err) {
        console.error("Get Request By ID Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// UPDATE REQUEST CONTACT STATUS
// -------------------------------------------------------------
export const updateRequest = async (req, res) => {
    const { id } = req.params;
    const { fullname, email, phone, project_details, contacted } = req.body;

    try {
        const updateQuery = `
            UPDATE requests 
      SET fullname = $1, email = $2, phone = $3, project_details = $4, contacted = $5, updated_at = NOW()
      WHERE request_id = $6
      RETURNING *;
        `;

        const values = [
            fullname,email,phone, project_details, contacted,id
        ];
        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Request entry not found." });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("❌ Database update failure in updateRequest:", err.message);
        res.status(500).json({ error: "Failed to update data records." });
    }
};