// List all DSAR requests
exports.listDSARRequests = async (req, res) => {
  try {
    const { partyId, status, requestType, priority, limit = 50, offset = 0 } = req.query;
    let query = {};
    if (partyId) query.partyId = partyId;
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (priority) query.priority = priority;
    const dsars = await DSAR.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ submittedAt: -1 });
    const total = await DSAR.countDocuments(query);
    res.json({ dsars, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching DSARs:', error);
    res.status(500).json({ error: 'Failed to fetch DSARs' });
  }
};

// Get DSAR request by ID
exports.getDSARRequestById = async (req, res) => {
  try {
    const dsar = await DSAR.findById(req.params.id);
    if (!dsar) return res.status(404).json({ error: 'DSAR not found' });
    res.json(dsar);
  } catch (error) {
    logger.error('Error fetching DSAR by ID:', error);
    res.status(500).json({ error: 'Failed to fetch DSAR by ID' });
  }
};

// Create DSAR request
exports.createDSARRequest = async (req, res) => {
  try {
    const dsar = new DSAR(req.body);
    await dsar.save();
    res.status(201).json(dsar);
  } catch (error) {
    logger.error('Error creating DSAR:', error);
    res.status(500).json({ error: 'Failed to create DSAR' });
  }
};

// Delete DSAR request by ID
exports.deleteDSARRequest = async (req, res) => {
  try {
    const deleted = await DSAR.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'DSAR not found' });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting DSAR:', error);
    res.status(500).json({ error: 'Failed to delete DSAR' });
  }
};

// List DSAR requests by partyId
exports.listDSARRequestsByParty = async (req, res) => {
  try {
    const dsars = await DSAR.find({ partyId: req.params.partyId }).sort({ submittedAt: -1 });
    res.json(dsars);
  } catch (error) {
    logger.error('Error fetching DSARs by party:', error);
    res.status(500).json({ error: 'Failed to fetch DSARs by party' });
  }
};
const DSAR = require('../models/DSAR');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

exports.getAllDSARs = async (req, res) => {
  try {
    const { partyId, status, requestType, priority, limit = 50, offset = 0 } = req.query;
    let query = {};
    if (partyId) query.partyId = partyId;
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (priority) query.priority = priority;

    const dsars = await DSAR.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ submittedAt: -1 });

    const total = await DSAR.countDocuments(query);

    res.json({ dsars, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching DSARs:', error);
    res.status(500).json({ error: 'Failed to fetch DSARs' });
  }
};

exports.getDSARById = async (req, res) => {
  try {
    const dsar = await DSAR.findOne({ id: req.params.id });
    if (!dsar) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }
    res.json(dsar);
  } catch (error) {
    logger.error('Error fetching DSAR:', error);
    res.status(500).json({ error: 'Failed to fetch DSAR' });
  }
};

exports.createDSAR = async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.body.partyId });
    if (!party) {
      return res.status(400).json({ error: 'Party not found' });
    }

    const dsar = new DSAR(req.body);
    await dsar.save();

    await AuditLog.logEvent({
      eventType: 'dsar_created',
      partyId: dsar.partyId,
      actorType: 'csr',
      action: 'create',
      description: `DSAR request created for party ${party.name}`,
      details: dsar.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(201).json(dsar);
  } catch (error) {
    logger.error('Error creating DSAR:', error);
    res.status(500).json({ error: 'Failed to create DSAR' });
  }
};

exports.updateDSAR = async (req, res) => {
  try {
    const oldDSAR = await DSAR.findOne({ id: req.params.id });
    if (!oldDSAR) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }

    const updatedDSAR = await DSAR.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    await AuditLog.logEvent({
      eventType: 'dsar_updated',
      partyId: updatedDSAR.partyId,
      actorType: 'csr',
      action: 'update',
      description: `DSAR request updated for party ${updatedDSAR.partyId}`,
      oldValues: oldDSAR.toJSON(),
      newValues: updatedDSAR.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.json(updatedDSAR);
  } catch (error) {
    logger.error('Error updating DSAR:', error);
    res.status(500).json({ error: 'Failed to update DSAR' });
  }
};

exports.deleteDSAR = async (req, res) => {
  try {
    const dsar = await DSAR.findOne({ id: req.params.id });
    if (!dsar) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }

    await DSAR.findOneAndDelete({ id: req.params.id });

    await AuditLog.logEvent({
      eventType: 'dsar_deleted',
      partyId: dsar.partyId,
      actorType: 'csr',
      action: 'delete',
      description: `DSAR request deleted for party ${dsar.partyId}`,
      details: dsar.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting DSAR:', error);
    res.status(500).json({ error: 'Failed to delete DSAR' });
  }
};

exports.getDSARsByPartyId = async (req, res) => {
  try {
    const dsars = await DSAR.find({ partyId: req.params.partyId });
    res.json(dsars);
  } catch (error) {
    logger.error('Error fetching DSARs by party:', error);
    res.status(500).json({ error: 'Failed to fetch DSARs by party' });
  }
};
