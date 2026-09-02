import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/authUtils.js';


// -------------------------------------------------------------
// LOGIN
// -------------------------------------------------------------
export const login = async (req, res) => {
    const { username, password, platform, device_name } = req.body;

    try {
        // 1. Fetch user details (including email and password hash)
        // Checks both username and email input fields
        const userResult = await pool.query(
            `SELECT u.userid, u.name, u.email, u.password, u.role_id, r.*
             FROM users u 
             JOIN roles r ON u.role_id = r.role_id 
             WHERE u.username = $1 OR u.email = $1`,
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        // 2. Validate password against hashed password in database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 3. Generate tokens
        const accessToken = generateAccessToken(user);
        const { token: refreshToken, tokenHash, familyId } = generateRefreshToken(user.userid);

        // 4. Save session in user_sessions table
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
        const userAgent = req.headers['user-agent'] || null;

        await pool.query(
            `INSERT INTO user_sessions (
                userid, token_hash, family_id, is_revoked, 
                platform, device_name, ip_address, user_agent, 
                created_at, last_used_at, expires_at, updated_at
            ) VALUES ($1, $2, $3, false, $4, $5, $6, $7, NOW(), NOW(), $8, NOW())`,
            [
                user.userid,
                tokenHash,
                familyId,
                platform || 'web',
                device_name || 'unknown',
                ipAddress,
                userAgent,
                expiresAt
            ]
        );
        // 5. Separate role metadata from permission flags
        const { role_id, role_name, created_at, updated_at, ...userAccess } = user;

        // 6. Send response with userAccess payload
        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.userid,
                name: user.name,
                email: user.email,
                role: user.role_name
            },
            userAccess // Sends { dashboard_acc: 1, dashboard_edit: 0, ... }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Server error during login" });
    }
};

// -------------------------------------------------------------
// Get My Profile
// -------------------------------------------------------------
export const getMe = async (req, res) => {
    try {
        // req.user.userid comes from your JWT auth middleware
        const userResult = await pool.query(
            `SELECT u.userid, u.name, u.email, r.role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.role_id 
             WHERE u.userid = $1`,
            [req.user.userid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        res.json({
            user: {
                id: user.userid,
                name: user.name,
                email: user.email,
                role: user.role_name,
                roleTitle: user.role_name
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};

// -------------------------------------------------------------
// Update My Profile
// -------------------------------------------------------------
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userid;
        const { name, email } = req.body;

        // 1. Validate input
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // 2. Check if the updated email belongs to another user
        const existingUser = await pool.query(
            `SELECT userid FROM users WHERE email = $1 AND userid != $2`,
            [trimmedEmail, userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email is already taken by another account" });
        }

        // 3. Update user details and join with roles using a Common Table Expression (CTE)
        const updateResult = await pool.query(
            `WITH updated_user AS (
                UPDATE users 
                SET name = $1, email = $2 
                WHERE userid = $3 
                RETURNING userid, name, email, role_id
            )
            SELECT u.userid, u.name, u.email, r.role_name 
            FROM updated_user u 
            LEFT JOIN roles r ON u.role_id = r.role_id`,
            [trimmedName, trimmedEmail, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = updateResult.rows[0];

        // 4. Return formatted user payload matching frontend expectations
        return res.json({
            message: "Profile updated successfully",
            user: {
                id: user.userid,
                name: user.name,
                email: user.email,
                role: user.role_name,
                roleTitle: user.role_name
            }
        });

    } catch (error) {
        console.error("Error updating user profile:", error);

        // Handle unique constraint error code in PostgreSQL (duplicate email race condition)
        if (error.code === '23505') {
            return res.status(400).json({ error: "Email is already taken" });
        }

        return res.status(500).json({ error: "Failed to update user profile" });
    }
};

// -------------------------------------------------------------
// REFRESH (Called when Access Token expires)
// -------------------------------------------------------------
export const refreshToken = async (req, res) => {
  // 1. Guard check for missing payload
  if (!req.body?.refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  const { refreshToken } = req.body;
  let client;

  try {
    client = await pool.connect();

    // 2. Verify JWT signature & compute token hash
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 3. Find session by token_hash & userid
    const sessionResult = await client.query(
      `SELECT * FROM user_sessions WHERE token_hash = $1 AND userid = $2`,
      [incomingHash, decoded.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid session token.' });
    }

    const currentSession = sessionResult.rows[0];

    // --- REUSE DETECTION (Replay Attack Protection) ---
    if (currentSession.is_revoked) {
      if (decoded.family_id) {
        await client.query(
          `UPDATE user_sessions SET is_revoked = true, updated_at = NOW() WHERE family_id = $1`,
          [decoded.family_id]
        );
      }
      return res.status(403).json({
        error: 'Security alert: Revoked token used. All sessions in this family invalidated.',
      });
    }

    // --- EXPIRATION CHECK ---
    if (new Date() > new Date(currentSession.expires_at)) {
      return res.status(403).json({ error: 'Refresh token has expired. Please log in again.' });
    }

    // 4. Fetch latest user role AND all permission columns from roles table (r.*)
    const userResult = await client.query(
      `SELECT u.userid, u.username, u.name, u.role_id, COALESCE(r.role_name, 'User') as role_name, r.* 
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.userid = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userWithRole = userResult.rows[0];

    // Separate user/role metadata from permission flags
    const { 
      userid, username, name, password, role_id, role_name, created_at, updated_at, 
      ...userAccess 
    } = userWithRole;

    const user = { userid, username, name, role_id, role_name };

    // 5. Generate fresh rotated tokens
    const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken(
      user.userid,
      currentSession.family_id
    );
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 6. Execute atomic rotation in PostgreSQL Transaction
    await client.query('BEGIN');

    // Revoke old token and update session with new hash and metadata
    await client.query(
      `UPDATE user_sessions 
       SET token_hash = $1, 
           expires_at = $2, 
           last_used_at = NOW(), 
           updated_at = NOW(),
           ip_address = $3,
           user_agent = $4
       WHERE id = $5`,
      [
        newHash,
        expiresAt,
        req.ip || currentSession.ip_address,
        req.headers['user-agent'] || currentSession.user_agent,
        currentSession.id,
      ]
    );

    await client.query('COMMIT');

    // 7. Generate fresh Access Token
    const newAccessToken = generateAccessToken(user);

    // 🟢 Send new tokens along with updated userAccess payload
    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userAccess // { dashboard_acc: 1, dashboard_edit: 0, ... }
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('Refresh error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired refresh token.' });

  } finally {
    if (client) {
      client.release();
    }
  }
};

// -------------------------------------------------------------
// LOGOUT
// -------------------------------------------------------------
export const logout = async (req, res) => {
    // 💡 Added fallback '|| {}' to prevent TypeError if req.body is undefined
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Revoke session in database
        await pool.query(
            `UPDATE user_sessions SET is_revoked = true, updated_at = NOW() WHERE token_hash = $1`,
            [tokenHash]
        );

        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({ error: "Failed to log out" });
    }
};