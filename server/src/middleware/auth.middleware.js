import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { generateTokens, setTokenCookies } from '../utils/token.utils.js';

export const verifyAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || 'access_secret');
        req.user = await User.findById(decoded.id).select('-refreshToken');
        if (req.user) return next();
      } catch (_err) {
        // Access token expired or invalid, fall through to refresh token verification
      }
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No valid tokens found' });
    }

    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh_secret'
    );
    const user = await User.findById(decodedRefresh.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid refresh token' });
    }

    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user);
    user.refreshToken = newRefresh;
    await user.save();

    setTokenCookies(res, newAccess, newRefresh);
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};
