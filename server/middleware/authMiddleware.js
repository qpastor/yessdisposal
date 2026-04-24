import jwt from 'jsonwebtoken';
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    let token = req.cookies?.yess_session

    console.log("Token received:", token); // DEBUG LINE

    if (!token) {
        console.log("No token found in cookies");
        return res.status(401).json({ error: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch user and their role name from DB
        const userResult = await pool.query(
            "SELECT u.userid, u.role_id, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.userid = $1", 
            [decoded.id]
        );

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: "Not authorized, token failed" });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role_name === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};