require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

const { protect } = require('./middleware/auth');
const seedData = require('./seeder');

const Profile = require('./models/Profile');
const Project = require('./models/Project');
const Skill = require('./models/Skill');
const Timeline = require('./models/Timeline');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio_db';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(process.cwd()));

// =========================================================
// MONGODB SERVERLESS CACHED CONNECTION
// =========================================================
let cachedDbConnection = null;

async function connectDB() {
  if (cachedDbConnection && mongoose.connection.readyState === 1) {
    return cachedDbConnection;
  }
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    cachedDbConnection = conn;
    console.log(`✅ MongoDB connected successfully to ${mongoose.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
}

// Middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Database connection error: ' + err.message });
    }
  }
  next();
});

// =========================================================
// NODEMAILER GMAIL SMTP SERVICE
// =========================================================
function getMailTransporter() {
  const user = process.env.GMAIL_USER || 'ratulshee6@gmail.com';
  const pass = (process.env.GMAIL_APP_PASSWORD || 'okzvewmksrwsdnlq').replace(/\s+/g, '');

  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Helper to format custom outgoing email template
function formatEmailHtml(subject, content, recipientName = '') {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #06090f; color: #f1f7f5; margin: 0; padding: 20px; }
      .email-card { max-width: 600px; margin: 0 auto; background: #0e1726; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .email-header { background: #080d16; padding: 24px; border-bottom: 2px solid #39ff9c; }
      .email-logo { font-size: 18px; font-weight: bold; color: #f1f7f5; }
      .email-logo span { color: #39ff9c; }
      .email-body { padding: 32px 28px; line-height: 1.7; color: #cbd5e1; font-size: 15px; }
      .email-body h2 { color: #ffffff; margin-top: 0; font-size: 20px; }
      .email-content-box { background: #09101d; border: 1px solid rgba(255, 255, 255, 0.08); padding: 18px; border-radius: 8px; margin: 20px 0; color: #e2e8f0; white-space: pre-wrap; font-size: 14px; }
      .email-footer { background: #080d16; padding: 18px 28px; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; }
      .email-footer a { color: #38bdf8; text-decoration: none; }
      .btn { display: inline-block; background: #39ff9c; color: #030f08; font-weight: bold; padding: 10px 22px; border-radius: 9999px; text-decoration: none; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="email-card">
      <div class="email-header">
        <div class="email-logo">&lt;Ratul<span>.Shee</span>/&gt;</div>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Full-Stack MERN Developer</div>
      </div>
      <div class="email-body">
        ${recipientName ? `<p>Hello <strong>${recipientName}</strong>,</p>` : ''}
        <h2>${subject}</h2>
        <div class="email-content-box">${content}</div>
        <p>Best regards,<br><strong>Ratul Shee</strong><br><span style="color:#94a3b8; font-size: 13px;">Chandannagar, West Bengal, India</span></p>
        <a href="https://github.com/Ratul-Shee/" class="btn">View GitHub Profile ↗</a>
      </div>
      <div class="email-footer">
        Sent from Ratul Shee Portfolio System &bull; <a href="mailto:ratulshee6@gmail.com">ratulshee6@gmail.com</a>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Helper to format the admin alert copy when a visitor contacts
function formatAdminInquiryAlertHtml(name, email, subject, message) {
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' (IST)';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #06090f; color: #f1f7f5; margin: 0; padding: 20px; }
      .email-card { max-width: 620px; margin: 0 auto; background: #0e1726; border: 1px solid #39ff9c; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.6); }
      .email-header { background: #080d16; padding: 22px 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .badge { display: inline-block; background: rgba(57, 255, 156, 0.15); color: #39ff9c; border: 1px solid #39ff9c; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
      .email-body { padding: 26px; line-height: 1.6; color: #cbd5e1; }
      .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; background: #09101d; border-radius: 8px; overflow: hidden; }
      .info-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; }
      .info-table td.label { color: #94a3b8; width: 120px; font-weight: 600; }
      .info-table td.value { color: #f1f7f5; font-weight: 500; }
      .msg-box { background: #060a12; border-left: 4px solid #39ff9c; padding: 16px 18px; border-radius: 4px; color: #e2e8f0; white-space: pre-wrap; font-size: 14px; margin-top: 14px; }
      .actions-bar { margin-top: 24px; display: flex; gap: 12px; }
      .btn { display: inline-block; background: #39ff9c; color: #030f08; font-weight: bold; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-size: 13px; }
      .btn-ghost { display: inline-block; background: #142035; color: #38bdf8; border: 1px solid #38bdf8; font-weight: bold; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-size: 13px; }
      .footer { background: #080d16; padding: 16px 26px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    </style>
  </head>
  <body>
    <div class="email-card">
      <div class="email-header">
        <div class="badge">🔔 NEW PORTFOLIO CONTACT INQUIRY</div>
        <h2 style="margin: 0; color: #ffffff; font-size: 20px;">Message from ${name}</h2>
      </div>
      <div class="email-body">
        <p style="margin: 0 0 10px 0;">A visitor just submitted a new inquiry on your portfolio website. Here is a full copy of their submission:</p>
        
        <table class="info-table">
          <tr>
            <td class="label">Sender Name:</td>
            <td class="value"><strong>${name}</strong></td>
          </tr>
          <tr>
            <td class="label">Sender Email:</td>
            <td class="value"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td class="label">Subject:</td>
            <td class="value">${subject || 'General Inquiry'}</td>
          </tr>
          <tr>
            <td class="label">Received At:</td>
            <td class="value">${dateStr}</td>
          </tr>
        </table>

        <strong style="color: #ffffff; font-size: 14px;">Message Content:</strong>
        <div class="msg-box">${message}</div>

        <div style="margin-top: 22px;">
          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'Portfolio Inquiry')}" class="btn">✉️ Direct Reply to ${name}</a>
          <a href="https://ratulshee.me/admin" class="btn-ghost" style="margin-left: 8px;">⚡ Open Admin Portal</a>
        </div>
      </div>
      <div class="footer">
        Automated real-time notification delivered by Ratul Shee Portfolio &bull; <a href="https://ratulshee.me" style="color: #39ff9c; text-decoration: none;">ratulshee.me</a>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Helper to format visitor confirmation email receipt
function formatVisitorReceiptHtml(name, subject, message) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #06090f; color: #f1f7f5; margin: 0; padding: 20px; }
      .email-card { max-width: 600px; margin: 0 auto; background: #0e1726; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; overflow: hidden; }
      .email-header { background: #080d16; padding: 24px; border-bottom: 2px solid #39ff9c; }
      .email-logo { font-size: 18px; font-weight: bold; color: #f1f7f5; }
      .email-logo span { color: #39ff9c; }
      .email-body { padding: 28px; line-height: 1.7; color: #cbd5e1; font-size: 15px; }
      .email-body h2 { color: #ffffff; margin-top: 0; }
      .msg-copy { background: #09101d; border-left: 3px solid #38bdf8; padding: 14px 18px; border-radius: 6px; margin: 18px 0; color: #e2e8f0; font-size: 14px; white-space: pre-wrap; }
      .footer { background: #080d16; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
  </head>
  <body>
    <div class="email-card">
      <div class="email-header">
        <div class="email-logo">&lt;Ratul<span>.Shee</span>/&gt;</div>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Full-Stack MERN Developer</div>
      </div>
      <div class="email-body">
        <h2>Thank you for reaching out, ${name}!</h2>
        <p>I have received your message regarding <strong>"${subject || 'General Inquiry'}"</strong>. I appreciate your interest and will review your inquiry and get back to you shortly (typically within 12–24 hours).</p>

        <p><strong>A copy of your submitted message:</strong></p>
        <div class="msg-copy">${message}</div>

        <p>Best regards,<br><strong>Ratul Shee</strong><br><span style="color:#94a3b8; font-size: 13px;">Full-Stack MERN Developer &bull; Chandannagar, India</span></p>
      </div>
      <div class="footer">
        <a href="https://ratulshee.me" style="color: #39ff9c; text-decoration: none;">ratulshee.me</a> &bull; <a href="mailto:ratulshee6@gmail.com" style="color: #38bdf8; text-decoration: none;">ratulshee6@gmail.com</a>
      </div>
    </div>
  </body>
  </html>
  `;
}

// =========================================================
// PUBLIC API ROUTES
// =========================================================

// 1. Consolidated Portfolio Endpoint
app.get('/api/portfolio', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      await seedData();
      profile = await Profile.findOne();
    }
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    const skills = await Skill.find().sort({ category: 1, order: 1 });
    const timeline = await Timeline.find().sort({ order: 1 });

    res.json({
      success: true,
      data: { profile, projects, skills, timeline }
    });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving portfolio data.' });
  }
});

// 2. Submit Contact Form Message with Instant Email Copy to Ratul & Receipt to Visitor
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    // 1. Save message to MongoDB collection
    const newMsg = await Message.create({
      name,
      email,
      subject: subject || 'General Inquiry',
      message
    });
    console.log(`📥 New contact inquiry stored in MongoDB: from "${name}" <${email}>`);

    // 2. Send instant email copy to Ratul Shee's Gmail & visitor receipt (AWAIT in serverless)
    const transporter = getMailTransporter();
    let emailStatus = { adminSent: false, visitorSent: false };

    if (transporter) {
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.GMAIL_USER || 'ratulshee6@gmail.com';
      const sender = process.env.GMAIL_USER || 'ratulshee6@gmail.com';

      // (A) Send formatted copy to Ratul's Gmail inbox
      const adminMailOptions = {
        from: `"Portfolio Contact Form" <${sender}>`,
        to: adminEmail,
        replyTo: `${name} <${email}>`,
        subject: `📬 New Inquiry from ${name}: "${subject || 'General Inquiry'}"`,
        html: formatAdminInquiryAlertHtml(name, email, subject, message)
      };

      // (B) Also send a confirmation receipt copy to the visitor
      const visitorMailOptions = {
        from: `"Ratul Shee" <${sender}>`,
        to: email,
        replyTo: sender,
        subject: `Thank you for contacting Ratul Shee — Receipt: "${subject || 'Inquiry'}"`,
        html: formatVisitorReceiptHtml(name, subject, message)
      };

      // In serverless environments, we MUST await before terminating the lambda invocation
      const [adminResult, visitorResult] = await Promise.allSettled([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(visitorMailOptions)
      ]);

      if (adminResult.status === 'fulfilled') {
        console.log(`✅ Copy of inquiry successfully emailed to ${adminEmail} (ID: ${adminResult.value.messageId})`);
        emailStatus.adminSent = true;
      } else {
        console.error('⚠️ Could not send admin email copy:', adminResult.reason?.message);
      }

      if (visitorResult.status === 'fulfilled') {
        console.log(`✅ Confirmation receipt emailed to visitor <${email}> (ID: ${visitorResult.value.messageId})`);
        emailStatus.visitorSent = true;
      } else {
        console.error('⚠️ Could not send visitor confirmation receipt:', visitorResult.reason?.message);
      }
    } else {
      console.warn('⚠️ Gmail App Password not configured; skipping email copy.');
    }

    res.status(201).json({
      success: true,
      message: 'Message delivered successfully and confirmation copy sent to email!',
      data: newMsg,
      emailStatus
    });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ success: false, error: 'Failed to record message.' });
  }
});

// =========================================================
// AUTHENTICATION API ROUTES
// =========================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required.' });
    }

    const expectedUser = process.env.ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASS || 'admin123';

    let user = await User.findOne({ username });

    // Auto-create default admin if not existing in Atlas database
    if (!user && username === expectedUser) {
      user = await User.create({
        username: expectedUser,
        password: expectedPass,
        role: 'admin'
      });
      console.log('✓ Admin user auto-initialized in database:', expectedUser);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // In case password was reset in environment variables
      if (username === expectedUser && password === expectedPass) {
        user.password = expectedPass;
        await user.save();
      } else {
        return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
      }
    }

    const token = user.getSignedJwtToken();
    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed: ' + err.message });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Admin password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to change password.' });
  }
});

// =========================================================
// EMAIL DISPATCH API (NODEMAILER / GMAIL SMTP)
// =========================================================

// Check email configuration status
app.get('/api/email/config', protect, (req, res) => {
  const user = process.env.GMAIL_USER || 'ratulshee6@gmail.com';
  const hasPass = !!process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim().length > 0;
  res.json({
    success: true,
    data: {
      gmailUser: user,
      isConfigured: hasPass
    }
  });
});

// Send custom email from Admin Panel
app.post('/api/email/send', protect, async (req, res) => {
  try {
    const { to, subject, message, recipientName } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Recipient "to", "subject", and "message" are required.' });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(400).json({
        success: false,
        error: 'Gmail App Password is not configured in .env (GMAIL_APP_PASSWORD). Please configure it in Settings.'
      });
    }

    const sender = process.env.GMAIL_USER || 'ratulshee6@gmail.com';
    const htmlBody = formatEmailHtml(subject, message, recipientName);

    const info = await transporter.sendMail({
      from: `"Ratul Shee" <${sender}>`,
      to: to,
      replyTo: sender,
      subject: subject,
      text: message,
      html: htmlBody
    });

    res.json({
      success: true,
      message: `Email successfully sent to ${to}!`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({
      success: false,
      error: 'Gmail SMTP error: ' + (err.message || 'Authentication failed. Check your Gmail App Password.')
    });
  }
});

// Send diagnostic test email
app.post('/api/email/test', protect, async (req, res) => {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(400).json({
        success: false,
        error: 'Gmail App Password is not configured in .env. Please configure GMAIL_APP_PASSWORD first.'
      });
    }

    const sender = process.env.GMAIL_USER || 'ratulshee6@gmail.com';
    const testHtml = formatEmailHtml(
      'Gmail SMTP Gateway Test Successful',
      'This is a diagnostic confirmation email verifying that your portfolio Admin Panel is properly connected to Gmail SMTP and ready to dispatch emails.'
    );

    const info = await transporter.sendMail({
      from: `"Ratul Shee Admin" <${sender}>`,
      to: sender,
      subject: '✅ Gmail SMTP Connection Verified — Ratul Shee Portfolio',
      html: testHtml
    });

    res.json({
      success: true,
      message: `Diagnostic email successfully delivered to ${sender}!`,
      messageId: info.messageId
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'SMTP Test Failed: ' + err.message
    });
  }
});

// Save / Update Gmail App Password in .env runtime
app.post('/api/email/config', protect, async (req, res) => {
  try {
    const { gmailUser, gmailAppPassword } = req.body;
    if (gmailUser) process.env.GMAIL_USER = gmailUser;
    if (gmailAppPassword) process.env.GMAIL_APP_PASSWORD = gmailAppPassword.replace(/\s+/g, '');

    res.json({
      success: true,
      message: 'Gmail SMTP credentials updated in runtime!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update credentials.' });
  }
});

// =========================================================
// PROTECTED ADMIN CRUD API ROUTES
// =========================================================

// File Upload Endpoint
app.post('/api/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, fileUrl });
});

// Profile Update
app.put('/api/portfolio/profile', protect, async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile(req.body);
    } else {
      Object.assign(profile, req.body);
    }
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// Projects CRUD
app.get('/api/projects', async (req, res) => {
  const projects = await Project.find().sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: projects });
});

app.post('/api/projects', protect, async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/projects/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, message: 'Project removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Skills CRUD
app.get('/api/skills', async (req, res) => {
  const skills = await Skill.find().sort({ category: 1, order: 1 });
  res.json({ success: true, data: skills });
});

app.post('/api/skills', protect, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/skills/:id', protect, async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill not found.' });
    res.json({ success: true, data: skill });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/skills/:id', protect, async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ success: false, error: 'Skill not found.' });
    res.json({ success: true, message: 'Skill deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Timeline CRUD
app.get('/api/timeline', async (req, res) => {
  const timeline = await Timeline.find().sort({ order: 1 });
  res.json({ success: true, data: timeline });
});

app.post('/api/timeline', protect, async (req, res) => {
  try {
    const item = await Timeline.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/timeline/:id', protect, async (req, res) => {
  try {
    const item = await Timeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, error: 'Timeline item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/timeline/:id', protect, async (req, res) => {
  try {
    const item = await Timeline.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Timeline item not found.' });
    res.json({ success: true, message: 'Timeline item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Messages Inbox
app.get('/api/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

app.patch('/api/messages/:id/read', protect, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update message status.' });
  }
});

app.delete('/api/messages/:id', protect, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete message.' });
  }
});

// Backup Export & Import (JSON)
app.get('/api/portfolio/export', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne();
    const projects = await Project.find();
    const skills = await Skill.find();
    const timeline = await Timeline.find();
    const messages = await Message.find();

    const backup = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      data: { profile, projects, skills, timeline, messages }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=portfolio-backup-${Date.now()}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Backup export failed.' });
  }
});

app.post('/api/portfolio/import', protect, async (req, res) => {
  try {
    const { backup } = req.body;
    if (!backup || !backup.data) {
      return res.status(400).json({ success: false, error: 'Invalid backup file structure.' });
    }

    const { profile, projects, skills, timeline } = backup.data;

    if (profile) {
      await Profile.deleteMany({});
      delete profile._id;
      await Profile.create(profile);
    }
    if (projects && projects.length > 0) {
      await Project.deleteMany({});
      const sanitizedProjects = projects.map(p => { delete p._id; return p; });
      await Project.insertMany(sanitizedProjects);
    }
    if (skills && skills.length > 0) {
      await Skill.deleteMany({});
      const sanitizedSkills = skills.map(s => { delete s._id; return s; });
      await Skill.insertMany(sanitizedSkills);
    }
    if (timeline && timeline.length > 0) {
      await Timeline.deleteMany({});
      const sanitizedTimeline = timeline.map(t => { delete t._id; return t; });
      await Timeline.insertMany(sanitizedTimeline);
    }

    res.json({ success: true, message: 'Portfolio restored successfully from backup!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Import restore failed: ' + err.message });
  }
});

// Reset / Re-Seed Database
app.post('/api/seed', protect, async (req, res) => {
  try {
    await Profile.deleteMany({});
    await Project.deleteMany({});
    await Skill.deleteMany({});
    await Timeline.deleteMany({});
    await seedData();
    res.json({ success: true, message: 'Database reset & seeded with default content!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to re-seed database.' });
  }
});

// =========================================================
// HTML PAGE ROUTES (FALLBACK)
// =========================================================

app.get('/admin', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'index.html'));
});

// =========================================================
// STANDALONE LOCAL RUNNER
// =========================================================
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB()
    .then(async () => {
      await seedData();
      app.listen(PORT, () => {
        console.log(`🚀 Ratul Shee Portfolio Server active on http://localhost:${PORT}`);
        console.log(`🔒 Admin Portal accessible at http://localhost:${PORT}/admin`);
      });
    })
    .catch(err => {
      console.error('❌ Server startup error:', err);
    });
}

module.exports = app;
