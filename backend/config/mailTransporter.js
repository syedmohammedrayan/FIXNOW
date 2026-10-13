const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');
const lookup = promisify(dns.lookup);
require('dotenv').config();

let cachedIp = null;
let lastResolvedAt = 0;

/**
 * Creates a high-reliability nodemailer transporter for Gmail SMTP.
 * Bypasses Node 22/24+ dns.Resolver hang on Windows by resolving IPv4 via OS dns.lookup
 * and connecting over secure SSL port 465 with SNI servername validation.
 */
async function getMailTransporter() {
  const now = Date.now();
  // Refresh IP cache every 30 minutes
  if (!cachedIp || now - lastResolvedAt > 30 * 60 * 1000) {
    try {
      const { address } = await lookup('smtp.gmail.com');
      cachedIp = address;
      lastResolvedAt = now;
    } catch (e) {
      console.warn('⚠️ DNS lookup fallback for smtp.gmail.com:', e.message);
      if (!cachedIp) cachedIp = 'smtp.gmail.com';
    }
  }

  const isIp = /^[0-9.]+$/.test(cachedIp);

  return nodemailer.createTransport({
    host: cachedIp,
    port: 465,
    secure: true,
    ...(isIp ? {
      servername: 'smtp.gmail.com',
      tls: { servername: 'smtp.gmail.com' }
    } : {}),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

module.exports = { getMailTransporter };
