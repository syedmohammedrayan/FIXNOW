/**
 * Automated Test Suite for FIXNOW Terms & Conditions Enforcement
 * Tests server-side validation, role verification, version matching, action gating,
 * bookingId matching, and audit record generation.
 */

const { verifyAndRecordTerms, CUSTOMER_TERMS_VERSION, TECHNICIAN_TERMS_VERSION } = require('./middleware/termsValidator');

// Helper to mock express req & res
function createMockContext(reqOverrides = {}) {
  const req = {
    headers: {},
    body: {},
    ip: '127.0.0.1',
    ...reqOverrides,
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };

  return { req, res };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 FIXNOW Mandatory Terms & Conditions Enforcement Test');
  console.log('======================================================\n');

  // Test 1: Missing terms acknowledgement on customer booking
  console.log('Test 1: Rejects customer booking without terms acknowledgement');
  {
    const { req, res } = createMockContext({
      body: { customerId: 'cust_1', category: 'Plumbing' },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, `Status code is 400 (got ${res.statusCode})`);
    assert(res.body?.code === 'TERMS_ACCEPTANCE_REQUIRED', `Error code is TERMS_ACCEPTANCE_REQUIRED (got ${res.body?.code})`);
  }

  // Test 2: Terms checkbox not accepted (accepted === false)
  console.log('\nTest 2: Rejects booking if agreement checkbox is not checked');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_1',
        termsAcknowledgement: {
          role: 'customer',
          termsType: 'customer',
          termsVersion: CUSTOMER_TERMS_VERSION,
          action: 'confirm_booking',
          accepted: false,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, `Status code is 400 (got ${res.statusCode})`);
    assert(res.body?.code === 'TERMS_NOT_ACCEPTED', `Error code is TERMS_NOT_ACCEPTED (got ${res.body?.code})`);
  }

  // Test 3: Role mismatch (technician role attempting customer booking)
  console.log('\nTest 3: Rejects customer action with technician role');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_1',
        termsAcknowledgement: {
          role: 'technician',
          termsType: 'technician',
          termsVersion: TECHNICIAN_TERMS_VERSION,
          action: 'confirm_booking',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 403, `Status code is 403 (got ${res.statusCode})`);
    assert(res.body?.code === 'TERMS_ROLE_MISMATCH', `Error code is TERMS_ROLE_MISMATCH (got ${res.body?.code})`);
  }

  // Test 4: Version mismatch (outdated customer-v0)
  console.log('\nTest 4: Rejects outdated or invalid terms version');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_1',
        termsAcknowledgement: {
          role: 'customer',
          termsType: 'customer',
          termsVersion: 'customer-v0',
          action: 'confirm_booking',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, `Status code is 400 (got ${res.statusCode})`);
    assert(res.body?.code === 'TERMS_VERSION_MISMATCH', `Error code is TERMS_VERSION_MISMATCH (got ${res.body?.code})`);
  }

  // Test 5: Action mismatch (attempting broadcast with confirm_booking acknowledgement)
  console.log('\nTest 5: Rejects action mismatch (broadcast action with confirm_booking terms)');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_1',
        technicianId: 'broadcast',
        termsAcknowledgement: {
          role: 'customer',
          termsType: 'customer',
          termsVersion: CUSTOMER_TERMS_VERSION,
          action: 'confirm_booking',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'initiate_broadcast',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, `Status code is 400 (got ${res.statusCode})`);
    assert(res.body?.code === 'TERMS_ACTION_MISMATCH', `Error code is TERMS_ACTION_MISMATCH (got ${res.body?.code})`);
  }

  // Test 6: Successful Customer Booking Confirmation
  console.log('\nTest 6: Successfully verifies customer booking confirmation');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_123',
        customerName: 'Alice Johnson',
        contactNumber: '9876543210',
        termsAcknowledgement: {
          role: 'customer',
          termsType: 'customer',
          termsVersion: 'customer-v1',
          action: 'confirm_booking',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result !== null, 'Result is not null');
    assert(result.role === 'customer', 'Role is customer');
    assert(result.termsVersion === 'customer-v1', 'Version is customer-v1');
    assert(result.action === 'confirm_booking', 'Action is confirm_booking');
    assert(result.actorId === 'cust_123', `Authoritative actorId is cust_123 (got ${result.actorId})`);
    assert(typeof result.acceptedAt === 'string', 'Server timestamp acceptedAt is set');
    assert(req.termsAcceptanceRecord === result, 'termsAcceptanceRecord attached to req');
  }

  // Test 7: Successful Customer Broadcast Initiation
  console.log('\nTest 7: Successfully verifies customer broadcast initiation');
  {
    const { req, res } = createMockContext({
      body: {
        customerId: 'cust_456',
        technicianId: 'broadcast',
        termsAcknowledgement: {
          role: 'customer',
          termsType: 'customer',
          termsVersion: 'customer-v1',
          action: 'initiate_broadcast',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'initiate_broadcast',
    });
    assert(result !== null, 'Result is not null');
    assert(result.action === 'initiate_broadcast', 'Action is initiate_broadcast');
    assert(result.actorId === 'cust_456', 'Authoritative actorId is cust_456');
  }

  // Test 8: Technician accept-booking missing terms
  console.log('\nTest 8: Rejects technician booking acceptance without terms');
  {
    const { req, res } = createMockContext({
      body: {
        bookingId: 'BK_999',
        technicianId: 'tech_789',
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'technician',
      requiredAction: 'accept_booking',
      targetBookingId: 'BK_999',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, 'Status code is 400');
    assert(res.body?.code === 'TERMS_ACCEPTANCE_REQUIRED', 'Error code is TERMS_ACCEPTANCE_REQUIRED');
  }

  // Test 9: Technician booking acceptance with mismatched bookingId
  console.log('\nTest 9: Rejects technician booking acceptance with mismatched bookingId');
  {
    const { req, res } = createMockContext({
      body: {
        bookingId: 'BK_999',
        technicianId: 'tech_789',
        termsAcknowledgement: {
          role: 'technician',
          termsType: 'technician',
          termsVersion: 'technician-v1',
          action: 'accept_booking',
          bookingId: 'BK_DIFFERENT',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'technician',
      requiredAction: 'accept_booking',
      targetBookingId: 'BK_999',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, 'Status code is 400');
    assert(res.body?.code === 'TERMS_BOOKING_MISMATCH', `Error code is TERMS_BOOKING_MISMATCH (got ${res.body?.code})`);
  }

  // Test 10: Successful Technician Booking Acceptance
  console.log('\nTest 10: Successfully verifies technician booking acceptance');
  {
    const { req, res } = createMockContext({
      body: {
        bookingId: 'BK_999',
        technicianId: 'tech_789',
        termsAcknowledgement: {
          role: 'technician',
          termsType: 'technician',
          termsVersion: 'technician-v1',
          action: 'accept_booking',
          bookingId: 'BK_999',
          accepted: true,
        },
      },
    });
    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'technician',
      requiredAction: 'accept_booking',
      targetBookingId: 'BK_999',
    });
    assert(result !== null, 'Result is not null');
    assert(result.role === 'technician', 'Role is technician');
    assert(result.termsVersion === 'technician-v1', 'Version is technician-v1');
    assert(result.action === 'accept_booking', 'Action is accept_booking');
    assert(result.bookingId === 'BK_999', 'BookingId is BK_999');
    assert(result.actorId === 'tech_789', 'Authoritative actorId is tech_789');
  }

  // Test 11: Repeat acceptance isolation — acceptance from booking 1 cannot be reused for booking 2
  console.log('\nTest 11: Repeat acceptance isolation (Booking 1 acceptance rejected for Booking 2)');
  {
    const booking1Ack = {
      role: 'technician',
      termsType: 'technician',
      termsVersion: 'technician-v1',
      action: 'accept_booking',
      bookingId: 'BK_001',
      accepted: true,
    };

    // Technician tries to accept BK_002 using acknowledgement generated for BK_001
    const { req, res } = createMockContext({
      body: {
        bookingId: 'BK_002',
        technicianId: 'tech_789',
        termsAcknowledgement: booking1Ack,
      },
    });

    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'technician',
      requiredAction: 'accept_booking',
      targetBookingId: 'BK_002',
    });
    assert(result === null, 'Result is null');
    assert(res.statusCode === 400, 'Status code is 400');
    assert(res.body?.code === 'TERMS_BOOKING_MISMATCH', 'Target booking mismatch prevents reuse');
  }

  // Test 12: Nested bookingPayload compatibility for Razorpay verify endpoints
  console.log('\nTest 12: Successfully extracts terms from nested bookingPayload');
  {
    const { req, res } = createMockContext({
      body: {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
        bookingPayload: {
          customerId: 'cust_razorpay',
          termsAcknowledgement: {
            role: 'customer',
            termsType: 'customer',
            termsVersion: 'customer-v1',
            action: 'confirm_booking',
            accepted: true,
          },
        },
      },
    });

    const result = await verifyAndRecordTerms({
      req,
      res,
      requiredRole: 'customer',
      requiredAction: 'confirm_booking',
    });
    assert(result !== null, 'Result is not null');
    assert(result.actorId === 'cust_razorpay', 'Extracted actorId from bookingPayload');
  }

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner unexpected error:', err);
  process.exit(1);
});
