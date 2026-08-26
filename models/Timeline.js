const mongoose = require('mongoose');

const TimelineSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  dates: { type: String, required: true },
  badge: { type: String, default: 'Completed' },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Timeline', TimelineSchema);
