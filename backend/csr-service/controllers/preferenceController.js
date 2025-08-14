// Create a new preference
exports.createPreference = async (req, res) => {
  try {
    const preference = new Preference(req.body);
    await preference.save();
    res.status(201).json(preference);
  } catch (error) {
    logger.error('Error creating preference:', error);
    res.status(500).json({ error: 'Failed to create preference' });
  }
};
// Get preferences by partyId
exports.getPreferenceByPartyId = async (req, res) => {
  try {
    const preferences = await Preference.find({ partyId: req.params.partyId });
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching preferences by party:', error);
    res.status(500).json({ error: 'Failed to fetch preferences by party' });
  }
};

// Get a preference by ID
exports.getPreferenceById = async (req, res) => {
  try {
    const preference = await Preference.findById(req.params.id);
    if (!preference) return res.status(404).json({ error: 'Preference not found' });
    res.json(preference);
  } catch (error) {
    logger.error('Error fetching preference by ID:', error);
    res.status(500).json({ error: 'Failed to fetch preference by ID' });
  }
};

// Update a preference by ID
exports.updatePreference = async (req, res) => {
  try {
    const updated = await Preference.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Preference not found' });
    res.json(updated);
  } catch (error) {
    logger.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
};

// Delete a preference by ID
exports.deletePreference = async (req, res) => {
  try {
    const deleted = await Preference.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Preference not found' });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting preference:', error);
    res.status(500).json({ error: 'Failed to delete preference' });
  }
};
const Preference = require('../models/Preference');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

// 🔄 Helper: Resolve party by customerId
const getPartyByCustomerId = async (customerId) => {
  const party = await Party.findOne({ customerId });
  if (!party) throw new Error('No party found for this customer');
  return party;
};

// ✅ Create Preference by customerId
exports.createPreferenceByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const party = await getPartyByCustomerId(customerId);

    const preference = new Preference({ ...req.body, partyId: party._id });
    await preference.save();

    await AuditLog.create({
      action: 'CREATE',
      entity: 'Preference',
      entityId: preference.id,
      newValue: preference,
    });

    res.status(201).json(preference);
  } catch (error) {
    logger.error('Error creating preference by customerId:', error);
    res.status(500).json({ error: error.message || 'Failed to create preference' });
  }
};
// ✅ Create or Update Preference by partyId
exports.createOrUpdatePreferenceByPartyId = async (req, res) => {
  try {
    const { partyId } = req.params;

    let preference = await Preference.findOne({ partyId });

    if (preference) {
      // Update existing preference
      const oldValue = { ...preference.toObject() };
      preference.set(req.body);
      await preference.save();

      await AuditLog.create({
        action: 'UPDATE',
        entity: 'Preference',
        entityId: preference._id,
        oldValue,
        newValue: preference,
      });

      return res.status(200).json(preference);
    }

    // Create new preference
    preference = new Preference({ ...req.body, partyId });
    await preference.save();

    await AuditLog.create({
      action: 'CREATE',
      entity: 'Preference',
      entityId: preference._id,
      newValue: preference,
    });

    res.status(201).json(preference);
  } catch (error) {
    logger.error('Error in createOrUpdatePreferenceByPartyId:', error);
    res.status(500).json({ error: error.message || 'Failed to create or update preference' });
  }
};

// ✅ Get all Preferences by customerId
exports.getPreferencesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const party = await getPartyByCustomerId(customerId);

    const preferences = await Preference.find({ partyId: party._id }).sort({ updatedAt: -1 });

    if (!preferences.length) {
      return res.status(404).json({ error: 'No preferences found for this customer' });
    }

    res.json(preferences);
  } catch (error) {
    logger.error('Error getting preferences by customerId:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch preferences' });
  }
};
exports.getAllPreferences = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const preferences = await Preference.find({})
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ updatedAt: -1 });

    const total = await Preference.countDocuments();

    res.json({
      preferences,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};


// ✅ Update Preference by customerId
exports.updatePreferenceByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const party = await getPartyByCustomerId(customerId);

    const existing = await Preference.findOne({ partyId: party._id });
    if (!existing) {
      return res.status(404).json({ error: 'Preference not found for this customer' });
    }

    const updated = await Preference.findOneAndUpdate(
      { partyId: party._id },
      req.body,
      { new: true }
    );

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Preference',
      entityId: updated.id,
      oldValue: existing,
      newValue: updated,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating preference by customerId:', error);
    res.status(500).json({ error: error.message || 'Failed to update preference' });
  }
};

// ✅ Delete Preference by customerId
exports.deletePreferenceByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const party = await getPartyByCustomerId(customerId);

    const deleted = await Preference.findOneAndDelete({ partyId: party._id });
    if (!deleted) {
      return res.status(404).json({ error: 'Preference not found for this customer' });
    }

    await AuditLog.create({
      action: 'DELETE',
      entity: 'Preference',
      entityId: deleted.id,
      oldValue: deleted,
    });

    res.status(204).end();
  } catch (error) {
    logger.error('Error deleting preference by customerId:', error);
    res.status(500).json({ error: error.message || 'Failed to delete preference' });
  }
};
