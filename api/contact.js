// Vercel serverless function: POST /api/contact
// Sends each message from the portfolio contact form to your inbox through Gmail SMTP
// (the same setup as Laravel's MAIL_MAILER=smtp with a Google App Password).
//
// Set these in Vercel → Project → Settings → Environment Variables, then redeploy:
//   GMAIL_USER          your Gmail address, e.g. magbunagceljie@gmail.com
//   GMAIL_APP_PASSWORD  the 16-character App Password from Google (no spaces needed)
//   CONTACT_TO_EMAIL    optional; where messages go (defaults to GMAIL_USER)
//   ALLOWED_ORIGIN      optional; only needed if the form is on a different site than this API

import nodemailer from 'nodemailer';

const MAX = { name: 100, email: 200, message: 5000 };

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const to = process.env.CONTACT_TO_EMAIL || user;
  if (!user || !pass) {
    return send(res, 500, { error: 'The contact form is not set up yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: real visitors never fill the hidden "company" field; bots usually do.
  if (clean(body.company, 200)) return send(res, 200, { ok: true });

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const message = clean(body.message, MAX.message);

  if (!name || !email || !message) {
    return send(res, 400, { error: 'Please fill in your name, email and message.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return send(res, 400, { error: 'Please enter a valid email address.' });
  }

  // Gmail SMTP, like Laravel: MAIL_HOST=smtp.gmail.com, MAIL_PORT=465, MAIL_ENCRYPTION=ssl
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const safeName = name.replace(/["<>\r\n]/g, '').slice(0, 60);

  // Workflow step 1: notify you
  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${user}>`, // Gmail requires sending from your own address
      to,
      replyTo: `"${safeName}" <${email}>`, // hit Reply to answer the visitor
      subject: `New portfolio message from ${safeName}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
  } catch (err) {
    console.error('Notify email failed', err);
    return send(res, 500, { error: 'Could not send right now. Please try again or email me directly.', step: 'notify' });
  }

  // Workflow step 2: auto-reply to the visitor.
  // It deliberately does NOT echo their message back, so the form can't be used to send
  // arbitrary text to strangers from your Gmail.
  let autoreply = true;
  try {
    await transporter.sendMail({
      from: `"Celjie Magbunag" <${user}>`,
      to: email,
      subject: `Thanks for reaching out, ${safeName}!`,
      text:
        `Hi ${safeName},\n\n` +
        `Thanks for your message! I've received it and will get back to you within 1-2 business days.\n\n` +
        `If it's urgent, you can reply directly to this email.\n\n` +
        `Celjie Magbunag\n` +
        `E-commerce Data & Automation Specialist · Full-Stack Developer\n` +
        `${user}`,
    });
  } catch (err) {
    console.error('Auto-reply failed', err);
    autoreply = false; // you still got the message, so the request counts as a success
  }

  return send(res, 200, { ok: true, notify: true, autoreply });
}
