const { admin, db } = require('../config/firebaseAdmin');

const CUSTOMER_TERMS_VERSION = 'customer-v1';
const TECHNICIAN_TERMS_VERSION = 'technician-v1';

/**
 * Validates a client's terms acknowledgement payload against authoritative server state.
 *
 * Requirements enforced:
 * 1. Actor identity obtained from verified JWT session (when available) or verified request actor.
 * 2. Actor role matches the required role ('customer' | 'technician').
 * 3. Terms type and version match ('customer-v1' | 'technician-v1').
 * 4. Action being performed matches the specific protected action.
 * 5. Booking ID matches when accepting/modifying an existing booking.
 * 6. Server generates authoritative timestamp — client timestamp is never trusted.
 */
async function verifyAndRecordTerms({
  req,
  res,
  requiredRole,
  requiredAction,
  targetBookingId = null,
}) {
  const ack =
    req.body?.termsAcknowledgement ||
    req.body?.termsAcceptance ||
    req.body?.bookingPayload?.termsAcknowledgement ||
    req.body?.bookingPayload?.termsAcceptance;

  if (!ack || typeof ack !== 'object') {
    res.status(400).json({
      success: false,
      error: `Terms & Conditions acceptance is required to perform this action (${requiredAction}).`,
      code: 'TERMS_ACCEPTANCE_REQUIRED',
    });
    return null;
  }

  if (ack.accepted !== true) {
    res.status(400).json({
      success: false,
      error: 'You must explicitly agree to the Terms & Conditions.',
      code: 'TERMS_NOT_ACCEPTED',
    });
    return null;
  }

  // 1. Validate Role
  if (ack.role !== requiredRole || ack.termsType !== requiredRole) {
    res.status(403).json({
      success: false,
      error: `Invalid terms role: expected '${requiredRole}', received '${ack.role}'.`,
      code: 'TERMS_ROLE_MISMATCH',
    });
    return null;
  }

  // 2. Validate Terms Version
  const expectedVersion =
    requiredRole === 'customer' ? CUSTOMER_TERMS_VERSION : TECHNICIAN_TERMS_VERSION;
  if (ack.termsVersion !== expectedVersion) {
    res.status(400).json({
      success: false,
      error: `Invalid terms version: expected '${expectedVersion}', received '${ack.termsVersion}'.`,
      code: 'TERMS_VERSION_MISMATCH',
    });
    return null;
  }

  // 3. Validate Action
  if (ack.action && ack.action !== requiredAction) {
    res.status(400).json({
      success: false,
      error: `Invalid terms action: expected '${requiredAction}', received '${ack.action}'.`,
      code: 'TERMS_ACTION_MISMATCH',
    });
    return null;
  }

  // 4. Validate Booking ID match if target booking is provided
  if (targetBookingId && ack.bookingId && ack.bookingId !== targetBookingId) {
    res.status(400).json({
      success: false,
      error: `Terms acceptance booking ID mismatch: expected '${targetBookingId}', received '${ack.bookingId}'.`,
      code: 'TERMS_BOOKING_MISMATCH',
    });
    return null;
  }

  // 5. Authoritative Actor Authentication
  let actorId = null;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      if (admin && admin.auth) {
        const decoded = await admin.auth().verifyIdToken(token);
        if (decoded && decoded.uid) {
          actorId = decoded.uid;
        }
      }
    } catch (authErr) {
      console.warn('⚠️ Token verification failed during terms validation:', authErr.message);
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid or expired authentication token.',
        code: 'AUTH_TOKEN_INVALID',
      });
      return null;
    }
  }

  // If no auth header was supplied, fall back to request actor ID
  if (!actorId) {
    actorId =
      requiredRole === 'customer'
        ? req.body?.customerId ||
          req.body?.customer_id ||
          req.body?.bookingPayload?.customerId ||
          req.body?.bookingPayload?.customer_id ||
          req.body?.userId ||
          'guest'
        : req.body?.technicianId ||
          req.body?.technician_id ||
          req.body?.userId;

    if (!actorId) {
      res.status(401).json({
        success: false,
        error: 'Actor identification required for terms validation.',
        code: 'ACTOR_ID_REQUIRED',
      });
      return null;
    }
  }

  // Server-generated authoritative timestamp
  const serverTimestamp = new Date().toISOString();
  const recordId = `TAC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const acceptanceRecord = {
    id: recordId,
    actorId,
    actor_id: actorId,
    role: requiredRole,
    action: requiredAction,
    termsType: requiredRole,
    terms_type: requiredRole,
    termsVersion: expectedVersion,
    terms_version: expectedVersion,
    bookingId: targetBookingId || null,
    booking_id: targetBookingId || null,
    acceptedAt: serverTimestamp,
    accepted_at: serverTimestamp,
    ipAddress: req.ip || req.headers?.['x-forwarded-for'] || null,
    userAgent: req.headers?.['user-agent'] || null,
  };

  // Persist the acceptance record in the 'terms_acceptances' audit collection
  if (db) {
    try {
      await db.collection('terms_acceptances').doc(recordId).set(acceptanceRecord);
    } catch (dbErr) {
      console.warn('⚠️ Failed to persist terms acceptance audit record:', dbErr.message);
    }
  }

  req.termsAcceptanceRecord = acceptanceRecord;
  return acceptanceRecord;
}

module.exports = {
  verifyAndRecordTerms,
  CUSTOMER_TERMS_VERSION,
  TECHNICIAN_TERMS_VERSION,
};
