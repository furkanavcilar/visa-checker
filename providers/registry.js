// registry.js
// Tüm provider modüllerini tek yerde toplayan yapı

const idata = require("./idata");
const vfs = require("./vfs");
const tls = require("./tls");
const bls = require("./bls");

async function queryAllProviders(params) {
  const providers = [idata, vfs, tls, bls];
  const results = [];

  for (const provider of providers) {
    try {
      const response = await provider.checkAvailability(params);
      results.push(...response);
    } catch (err) {
      console.error(`[HTTP ERROR] ${err.message}`);
    }
  }

  return results;
}

module.exports = { queryAllProviders };
