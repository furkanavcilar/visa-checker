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
  const results = [];

  for (const missionCode of params.missionCodes) {
    for (const provider of providers) {
      try {
        const res = await provider.fn({
          city: params.city,
          missionCode
        });
        results.push(...res);
      } catch (err) {
        results.push({
          provider: provider.name,
          missionCode,
          city: params.city,
          status: 'unknown',
          date: null,
          note: `Hata: ${err.message}`
        });
      }
    }
  }

  return results;
}

module.exports = { queryAllProviders };
