import jwt from 'jsonwebtoken';
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    let token;

    // 1. Check if the token is arriving in the Authorization header format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // Extract the token string
    }

    console.log("Token received in middleware:", token); // DEBUG LINE

    if (!token) {
        console.log("No token found in Authorization header");
        return res.status(401).json({ error: "Not authorized, no token attached" });
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
        console.error("Token verification failed:", error.message);
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