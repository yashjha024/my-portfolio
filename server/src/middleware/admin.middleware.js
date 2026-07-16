/**
 * Owner/Admin Authorization Middleware (`verifyOwner` & `verifyAdmin`)
 * Enforces that the authenticated user holds the `owner` (or `editor`) role per PRD Section 8.
 */
export const verifyOwner = (req, res, next) => {
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  if (
    !req.user ||
    req.user.role !== 'owner' ||
    req.user.email?.toLowerCase() !== ownerEmail.toLowerCase()
  ) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Owner account access strictly required per PRD Section 8.',
    });
  }
  next();
};

export const verifyAdmin = verifyOwner;
