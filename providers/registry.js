// providers/registry.js
// Tüm sağlayıcıları tek yerden yöneten kayıt sistemi

const { checkAvailability: checkVisasbot } = require('./visasbot');
const { checkAvailability: checkVfs } = require('./vfs');
const { checkAvailability: checkIdata } = require('./idata');
const { checkAvailability: checkTls } = require('./tls');
const { checkAvailability: checkBls } = require('./bls');

const providers = [
  { name: 'visasbot', fn: checkVisasbot },
  { name: 'vfs', fn: checkVfs },
  { name: 'idata', fn: checkIdata },
  { name: 'tls', fn: checkTls },
  { name: 'bls', fn: checkBls },
];

/**
 * Belirtilen parametrelerle tüm sağlayıcılardan randevu sorgular
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Ankara)
 * @param {string[]} params.missionCodes - Ülkeler (örnek: ['ita', 'nld'])
 * @returns {Promise<Availability[]>}
 */

async function queryAllProviders(params) {
  const providers = [idata, vfs, tls, bls]; // senin mevcut provider modüllerin
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
