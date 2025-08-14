// Export all required consent controller functions
exports.listConsents = async (req, res) => {
  try {
    const { partyId, status, consentType, limit = 50, offset = 0 } = req.query;
    let query = {};
    if (partyId) query.partyId = partyId;
    if (status) query.status = status;
    if (consentType) query.consentType = consentType;
    const consents = await Consent.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    const total = await Consent.countDocuments(query);
    res.json({ consents, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
};

exports.getConsentById = async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json(consent);
  } catch (error) {
    logger.error('Error fetching consent:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
};

exports.createConsent = async (req, res) => {
  try {
    const consent = new Consent(req.body);
    await consent.save();
    res.status(201).json(consent);
  } catch (error) {
    logger.error('Error creating consent:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
};

exports.updateConsent = async (req, res) => {
  try {
    const updatedConsent = await Consent.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedConsent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json(updatedConsent);
  } catch (error) {
    logger.error('Error updating consent:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
};

exports.deleteConsent = async (req, res) => {
  try {
    const deletedConsent = await Consent.findOneAndDelete({ id: req.params.id });
    if (!deletedConsent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting consent:', error);
    res.status(500).json({ error: 'Failed to delete consent' });
  }
};

exports.listConsentsByParty = async (req, res) => {
  try {
    const partyId = req.params.partyId;
    if (!partyId) return res.status(400).json({ error: 'partyId required' });
    const consents = await Consent.find({ partyId }).sort({ createdAt: -1 });
    res.json(consents);
  } catch (error) {
    logger.error('Error fetching consents by party:', error);
    res.status(500).json({ error: 'Failed to fetch consents by party' });
  }
};
const Consent = require('../models/Consent');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

exports.listConsents = async (req, res) => {
// List consents by partyId
exports.listConsentsByParty = async (req, res) => {
  try {
    const partyId = req.params.partyId;
    if (!partyId) return res.status(400).json({ error: 'partyId required' });
    const consents = await Consent.find({ partyId }).sort({ createdAt: -1 });
    res.json(consents);
  } catch (error) {
    logger.error('Error fetching consents by party:', error);
    res.status(500).json({ error: 'Failed to fetch consents by party' });
  }
};
  try {
    const { partyId, status, consentType, limit = 50, offset = 0 } = req.query;

    let query = {};
    if (partyId) query.partyId = partyId;
    if (status) query.status = status;
    if (consentType) query.consentType = consentType;

    const consents = await Consent.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Consent.countDocuments(query);

    res.json({ consents, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
};

exports.getConsentById = async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json(consent);
  } catch (error) {
    logger.error('Error fetching consent:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
};

exports.createConsent = async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.body.partyId });
    if (!party) {
      return res.status(400).json({ error: 'Party not found' });
    }

    const consent = new Consent(req.body);
    await consent.save();

    await AuditLog.logEvent({
      eventType: 'consent_created',
      partyId: consent.partyId,
      actorType: 'csr',
      action: 'create',
      description: `Consent of type ${consent.consentType} created for party ${party.name}`,
      details: consent.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(201).json(consent);
  } catch (error) {
    logger.error('Error creating consent:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
};

exports.updateConsent = async (req, res) => {
  try {
    const oldConsent = await Consent.findOne({ id: req.params.id });
    if (!oldConsent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    const updatedConsent = await Consent.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    await AuditLog.logEvent({
      eventType: 'consent_updated',
      partyId: updatedConsent.partyId,
      actorType: 'csr',
      action: 'update',
      description: `Consent updated for party ${updatedConsent.partyId}`,
      oldValues: oldConsent.toJSON(),
      newValues: updatedConsent.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.json(updatedConsent);
  } catch (error) {
    logger.error('Error updating consent:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
};

exports.deleteConsent = async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    await Consent.findOneAndDelete({ id: req.params.id });

    await AuditLog.logEvent({
      eventType: 'consent_deleted',
      partyId: consent.partyId,
      actorType: 'csr',
      action: 'delete',
      description: `Consent deleted for party ${consent.partyId}`,
      details: consent.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting consent:', error);
    res.status(500).json({ error: 'Failed to delete consent' });
  }
};

exports.getConsentsByPartyId = async (req, res) => {
  try {
    const consents = await Consent.find({ partyId: req.params.partyId });
    res.json(consents);
  } catch (error) {
    logger.error('Error fetching consents by party:', error);
    res.status(500).json({ error: 'Failed to fetch consents by party' });
  }
};
