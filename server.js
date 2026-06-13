const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let payments = [];
let auditLog = [];
let notifications = [];

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (email === 'admin@school.com' && password === 'password' && role === 'admin') {
    const token = Buffer.from(JSON.stringify({ email, role })).toString('base64');
    auditLog.push({ timestamp: new Date(), user: email, action: 'LOGIN', status: 'SUCCESS' });
    res.json({ success: true, token, user: { email, role, name: 'School Admin' } });
  } else {
    auditLog.push({ timestamp: new Date(), user: email, action: 'LOGIN', status: 'FAILED' });
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  auditLog.push({ timestamp: new Date(), user: req.body.email, action: 'LOGOUT', status: 'SUCCESS' });
  res.json({ success: true });
});

// PAYMENTS
app.get('/api/payments', (req, res) => {
  res.json({ success: true, data: payments });
});

app.post('/api/payments', (req, res) => {
  const { student, amount, method, reference } = req.body;
  const payment = { id: Date.now(), student, amount, method, reference, date: new Date(), status: 'SUCCESS' };
  payments.push(payment);
  auditLog.push({ timestamp: new Date(), user: 'system', action: 'PAYMENT_RECORDED', details: `Payment of KES ${amount}`, status: 'SUCCESS' });
  res.json({ success: true, data: payment });
});

// NOTIFICATIONS
app.post('/api/notifications/send-reminder', (req, res) => {
  const { email, student, amount } = req.body;
  const notif = { id: Date.now(), type: 'EMAIL', recipient: email, subject: `Payment Reminder - ${student}`, message: `Payment reminder for KES ${amount}`, sentTime: new Date(), status: 'DELIVERED' };
  notifications.push(notif);
  auditLog.push({ timestamp: new Date(), user: 'system', action: 'SEND_REMINDER', details: `Reminder sent to ${email}`, status: 'SUCCESS' });
  res.json({ success: true, data: notif });
});

app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: notifications });
});

// REPORTS
app.get('/api/reports/summary', (req, res) => {
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  res.json({ success: true, data: { totalCollected, totalPending: 840000, paymentCount: payments.length, generatedAt: new Date() } });
});

app.get('/api/reports/export-csv', (req, res) => {
  let csv = 'Student,Amount,Date,Status\n';
  payments.forEach(p => { csv += `${p.student},KES ${p.amount},${p.date.toISOString()},${p.status}\n`; });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="payments-export.csv"');
  res.send(csv);
});

// AUDIT
app.get('/api/audit-log', (req, res) => {
  res.json({ success: true, data: auditLog });
});

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ElimuPay API Server running on http://localhost:${PORT}`);
});
