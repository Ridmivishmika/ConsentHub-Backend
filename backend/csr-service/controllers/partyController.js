const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');
const { createAuditLog } = require('../../shared/utils/auditLogger');
const createPartyForCustomer = async ({ email, displayName, phoneNumber, createdBy }) => {
  try {
    const party = new Party({
      name: displayName || email,
      email,
      phone: phoneNumber,
      type: 'individual',
      status: 'active',
      preferences: {
        language: 'en',
        timezone: 'Asia/Colombo'
      },
      metadata: {
        source: 'firebase'
      },
      createdBy
    });

    const savedParty = await party.save();

    // Optional: audit log
    await createAuditLog({
      action: 'PARTY_CREATED',
      userId: createdBy || 'system',
      service: 'auth-service',
      details: {
        partyId: savedParty.id,
        email
      }
    });

    return savedParty;
  } catch (error) {
    console.error('Error creating party:', error);
    throw new Error('Failed to create party');
  }
};

// Remove duplicate module.exports, use only exports for controller functions
exports.getAllParties = async (req, res) => {
  try {
    const { type, status, search, limit = 50, offset = 0 } = req.query;

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    const parties = await Party.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Party.countDocuments(query);

    res.json({
      parties,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching parties:', error);
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
};

exports.getPartyById = async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.params.id });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json(party);
  } catch (error) {
    logger.error('Error fetching party:', error);
    res.status(500).json({ error: 'Failed to fetch party' });
  }
};

exports.createParty = async (req, res) => {
  try {
    const party = new Party(req.body);
    await party.save();

    await AuditLog.logEvent({
      eventType: 'party_created',
      partyId: party.id,
      actorType: 'csr',
      action: 'create',
      description: `Party ${party.name} created`,
      details: { partyId: party.id, name: party.name, email: party.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(201).json(party);
  } catch (error) {
    logger.error('Error creating party:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create party' });
  }
};

exports.updateParty = async (req, res) => {
  try {
    const oldParty = await Party.findOne({ id: req.params.id });
    if (!oldParty) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const updatedParty = await Party.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    await AuditLog.logEvent({
      eventType: 'party_updated',
      partyId: updatedParty.id,
      actorType: 'csr',
      action: 'update',
      description: `Party ${updatedParty.name} updated`,
      oldValues: oldParty.toJSON(),
      newValues: updatedParty.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.json(updatedParty);
  } catch (error) {
    logger.error('Error updating party:', error);
    res.status(500).json({ error: 'Failed to update party' });
  }
};

exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.params.id });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    await Party.findOneAndDelete({ id: req.params.id });

    await AuditLog.logEvent({
      eventType: 'party_deleted',
      partyId: party.id,
      actorType: 'csr',
      action: 'delete',
      description: `Party ${party.name} deleted`,
      details: party.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting party:', error);
    res.status(500).json({ error: 'Failed to delete party' });
  }
};

exports.searchParties = async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } }
      ]
    };

    if (type) query.type = type;

    const parties = await Party.find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json(parties);
  } catch (error) {
    logger.error('Error searching parties:', error);
    res.status(500).json({ error: 'Failed to search parties' });
  }
};
