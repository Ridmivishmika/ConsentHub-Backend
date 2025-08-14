const mongoose = require('mongoose');
const partyDb = require('../db/partyDb');

const partySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: false
  },
  mobile: {
    type: String,
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  type: {
    type: String,
    enum: ['individual', 'organization', 'minor', 'guardian'],
    default: 'individual'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  guardianId: {
    type: String,
    required: false
  },
  guardianName: {
    type: String,
    required: false
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  metadata: {
    source: String,
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
partySchema.index({ email: 1 });
partySchema.index({ phone: 1 });
partySchema.index({ mobile: 1 });
partySchema.index({ type: 1 });
partySchema.index({ status: 1 });
partySchema.index({ guardianId: 1 });

// Virtual for age calculation
partySchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are serialized
partySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = partyDb.model('Party', partySchema);
