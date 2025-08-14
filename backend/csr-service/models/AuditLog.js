const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['party_created', 'party_updated', 'party_deleted', 'party_searched', 'login', 'logout']
  },
  partyId: {
    type: String,
    required: false
  },
  actorType: {
    type: String,
    required: true,
    enum: ['csr', 'system', 'customer']
  },
  actorId: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'search', 'login', 'logout']
  },
  description: {
    type: String,
    required: true
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  source: {
    type: String,
    required: true,
    enum: ['web', 'api', 'mobile', 'csr']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
auditLogSchema.index({ eventType: 1 });
auditLogSchema.index({ partyId: 1 });
auditLogSchema.index({ actorType: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to log events
auditLogSchema.statics.logEvent = async function(eventData) {
  try {
    const auditLog = new this(eventData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }
};

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLogs', auditLogSchema);


module.exports = AuditLog;
