import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/token.utils.js';

export const googleAuthCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
    );
  }

  const { accessToken, refreshToken } = generateTokens(req.user);
  req.user.refreshToken = refreshToken;
  await req.user.save();

  setTokenCookies(res, accessToken, refreshToken);
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin`);
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const logout = async (req, res) => {
  if (req.user) {
    req.user.refreshToken = null;
    await req.user.save();
  }
  clearTokenCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
