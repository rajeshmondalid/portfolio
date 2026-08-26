const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['languages', 'frontend', 'backend', 'tools'],
    default: 'frontend'
  },
  proficiency: { type: Number, required: true, min: 0, max: 100, default: 85 },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Skill', SkillSchema);
