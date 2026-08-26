const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Ratul Shee' },
  eyebrow: { type: String, default: "Hello World, I'm" },
  roles: [{ type: String }],
  location: { type: String, default: 'Chandannagar, West Bengal, India' },
  statusText: { type: String, default: 'Available for Full-Stack Roles & Freelance' },
  tagline: { type: String, default: 'Architecting robust web systems with MongoDB, Express.js, React, and Node.js. Turning complex business logic into lightning-fast, pixel-perfect user experiences.' },
  bioStory: [{ type: String }],
  avatarUrl: { type: String, default: 'profile.jpg' },
  resumeUrl: { type: String, default: '#' },
  defaultTheme: { type: String, default: 'emerald', enum: ['emerald', 'violet', 'cyan', 'amber'] },
  socials: {
    github: { type: String, default: 'https://github.com/Ratul-Shee/' },
    linkedin: { type: String, default: 'https://www.linkedin.com/in/ratul-shee/' },
    twitter: { type: String, default: 'https://x.com/RATUL_SHEE_666' },
    facebook: { type: String, default: 'https://www.facebook.com/ratul.shee.6/' },
    email: { type: String, default: 'ratulshee6@gmail.com' }
  },
  metrics: {
    languages: { type: Number, default: 4 },
    cleanCodePct: { type: Number, default: 100 },
    gradYear: { type: Number, default: 2027 },
    repos: { type: Number, default: 15 }
  },
  terminalWhoami: { type: String, default: 'Full-Stack MERN Developer based in Chandannagar, India. Specializing in high-performance web systems and AI workflows.' },
  customCommands: [{
    cmd: { type: String },
    output: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
