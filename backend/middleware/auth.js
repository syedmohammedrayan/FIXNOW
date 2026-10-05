const { admin } = require('../config/firebaseAdmin');

/**
 * Express middleware that verifies a Firebase ID Token (JWT) on every protected route.
 * Usage: router.get('/protected', verifyToken, handler)
 *
 * Flow: Client sends "Authorization: Bearer <idToken>" → this middleware decodes it
 * using Firebase Admin, attaches the user claims to req.user, then calls next().
 */
const verifyToken = async (req, res, next) => {
  // Check that the Authorization header is present and has the Bearer scheme.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Strip the "Bearer " prefix to get the raw JWT string.
  const token = authHeader.split('Bearer ')[1];
  try {
    // Firebase Admin verifies the token signature and expiry against Firebase's public keys.
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken) {
      throw new Error('Invalid token');
    }
    
    // Attach decoded claims (uid, email, role custom claims) so route handlers can read them.
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    // 403 (Forbidden) rather than 401 because a token was present but invalid.
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyToken };
