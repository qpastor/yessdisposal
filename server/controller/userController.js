import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import pool from '../config/db.js';

// -------------------------------------------------------------
// REGISTER USER
// -------------------------------------------------------------
export const registerUser = async (req, res) => {
    const { username, name, email, password, role_id } = req.body;

    try {
        // Check both username OR email fields
        const userExists = await pool.query(
            "SELECT * FROM users WHERE username = $1 OR email = $2", 
            [username, email]
        );

        if (userExists.rows.length > 0) {
            const existingUser = userExists.rows[0];
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Username already taken" });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ error: "Email already registered" });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (username, name, email, password, role_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [username, name, email, hashedPassword, role_id]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error("Registration Error Log:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// -------------------------------------------------------------
// GET ALL USERS
// -------------------------------------------------------------
export const getAllUsers = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                u.userid, 
                u.name, 
                u.username, 
                u.email, 
                u.isactive, 
                r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id
        `;
        
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Users Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// GET USER BY ID
// -------------------------------------------------------------
export const getUserById = async (req, res) => {
    try {
        const { userid } = req.params;
        const queryText = `
            SELECT 
                u.userid, 
                u.name, 
                u.username, 
                u.email, 
                u.isactive,
                u.role_id,
                r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.userid = $1
        `;

        const result = await pool.query(queryText, [userid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get User Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// UPDATE USER BY ID
// -------------------------------------------------------------
export const updateUser = async (req, res) => {
    try {
        const { userid } = req.params;
        
        // Handle both camelCase (frontend) and snake_case (backend)
        const name = req.body.name;
        const username = req.body.username;
        const email = req.body.email;
        const role_id = req.body.role_id ?? req.body.roleId;
        const isactive = req.body.isactive ?? req.body.isActive;

        // DEBUG LOGS - Check your terminal when saving

        const parsedUserId = parseInt(userid, 10);
        
        // Parse role_id properly
        const cleanRoleId = (role_id !== undefined && role_id !== null && role_id !== '') 
            ? parseInt(role_id, 10) 
            : null;

        // Parse isactive properly
        const finalIsActive = isactive !== undefined && isactive !== null
            ? (isactive === true || isactive === 'true' || isactive === 1)
            : null;

        const updateQuery = `
            UPDATE users 
            SET 
                name = COALESCE($1, name),
                username = COALESCE($2, username),
                email = COALESCE($3, email),
                isactive = COALESCE($4, isactive),
                role_id = COALESCE($5, role_id)
            WHERE userid = $6
            RETURNING *;
        `;

        const queryParams = [
            name || null,
            username || null,
            email || null,
            finalIsActive,
            cleanRoleId,
            parsedUserId
        ];

        const updateResult = await pool.query(updateQuery, queryParams);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const fullUserQuery = `
            SELECT u.userid, u.name, u.username, u.email, u.isactive, u.role_id, r.role_name 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.userid = $1
        `;
        const finalResult = await pool.query(fullUserQuery, [parsedUserId]);

        res.json(finalResult.rows[0]);
    } catch (err) {
        console.error("Update User Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// DISABLE USER BY ID
// -------------------------------------------------------------
export const disableUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const user = await pool.query(
            "UPDATE users SET isactive = false WHERE userid = $1 RETURNING *",
            [userid]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error("Disable User Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// ENABLE USER BY ID
// -------------------------------------------------------------
export const enableUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const user = await pool.query(
            "UPDATE users SET isactive = true WHERE userid = $1 RETURNING *",
            [userid]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error("Enable User Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// EXPORT USERS TO EXCEL
// -------------------------------------------------------------
export const exportUsersToExcel = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        u.userid, 
        u.name,
        u.username,
        u.email, 
        r.role_name,
        u.isactive 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.userid ASC
    `;
    
    const result = await pool.query(queryText); 
    const users = result.rows; 

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users List');

    worksheet.columns = [
      { header: 'User ID', key: 'userid', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Role', key: 'role_name', width: 20 },
      { header: 'Status', key: 'status_label', width: 15 }
    ];

    const formattedRows = users.map(user => ({
      ...user,
      role_name: user.role_name || 'No Role',
      status_label: user.isactive ? 'Active' : 'Inactive'
    }));

    worksheet.addRows(formattedRows);

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2D3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Set Response Headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Yess-Users-List.xlsx'
    );

    // Generate buffer and send cleanly
    const buffer = await workbook.xlsx.writeBuffer();
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('❌ User Excel Export Error Details:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Failed to export Excel file.', 
        error: error.message 
      });
    }
  }
};

// export const exportUsersToExcel = async (req, res) => {
//     try {
//         const queryText = `
//             SELECT 
//                 u.userid, 
//                 u.name,
//                 u.username,
//                 u.email, 
//                 r.role_name,
//                 u.isactive 
//             FROM users u 
//             LEFT JOIN roles r ON u.role_id = r.role_id
//             ORDER BY u.userid ASC
//         `;
//         const result = await pool.query(queryText); 
//         const users = result.rows; 

//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Users List');

//         worksheet.columns = [
//             { header: 'User ID', key: 'userid', width: 10 },
//             { header: 'Name', key: 'name', width: 20 },
//             { header: 'Username', key: 'username', width: 20 },
//             { header: 'Email Address', key: 'email', width: 30 },
//             { header: 'Role', key: 'role_name', width: 20 },
//             { header: 'Status', key: 'status_label', width: 15 }
//         ];

//         const formattedRows = users.map(user => ({
//             ...user,
//             status_label: user.isactive ? 'Active' : 'Inactive'
//         }));

//         worksheet.addRows(formattedRows);

//         const headerRow = worksheet.getRow(1);
//         headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
//         headerRow.fill = {
//             type: 'pattern',
//             pattern: 'solid',
//             fgColor: { argb: '2D3E50' }
//         };
//         headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', 'attachment; filename=Yess-Users-List.xlsx');

//         return await workbook.xlsx.write(res);

//     } catch (error) {
//         console.error('❌ User Excel Export Error Details:', error);
        
//         if (!res.headersSent) {
//             res.status(500).send('Export failed');
//         }
//     }
// };