// csr-service/db/partyDb.js
const mongoose = require('mongoose');


const dbUri = process.env.PARTY_DB_URI || 'mongodb://localhost:27017/consenthub_party';
if (!process.env.PARTY_DB_URI) {
  console.warn('Warning: PARTY_DB_URI not set. Using default local MongoDB URI.');
}

const partyDb = mongoose.createConnection(dbUri);
module.exports = partyDb;

module.exports = partyDb;
