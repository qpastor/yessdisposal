import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// 15-Minute Access Token with embedded role
export const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.userid, 
            role_name: user.role_name,
            role_id: user.role_id 
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '12h' }
    );
};

// 30-Day Refresh Token
export const generateRefreshToken = (userId, familyId = null) => {
    const newFamilyId = familyId || crypto.randomUUID();
    const token = jwt.sign(
        { id: userId, family_id: newFamilyId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
    );
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash, familyId: newFamilyId };
};