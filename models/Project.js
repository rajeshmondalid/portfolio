const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  key: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  category: { type: String, required: true, enum: ['mern', 'react', 'ai', 'other'], default: 'mern' },
  subtitle: { type: String, default: '' },
  description: { type: String, required: true },
  highlights: [{ type: String }],
  stack: [{ type: String }],
  imageUrl: { type: String, default: 'fintrack.jpg' },
  liveUrl: { type: String, default: '#' },
  repoUrl: { type: String, default: 'https://github.com/Ratul-Shee/' },
  isFeatured: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
