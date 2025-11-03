// providers/visasbot.js
// Artık doğrudan dış API değil, registry içindeki tüm sağlayıcılardan veri çeker

const { queryAllProviders } = require('./registry');

/**
 * Gerçek zamanlı randevu sorgulaması yapar
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Istanbul)
 * @param {string[]} params.missionCodes - Ülkeler (örnek: ['ita', 'fra', 'nld'])
 * @returns {Promise<Availability[]>}
 */
async function checkAvailability(params) {
  try {
    const results = await queryAllProviders(params);
    return results;
  } catch (err) {
    console.error('checkAvailability hatası:', err);
    return [{
      provider: 'visasbot',
      missionCode: 'general',
      city: params.city,
      status: 'unknown',
      date: null,
      note: `Hata oluştu: ${err.message}`
    }];
  }
}

module.exports = { checkAvailability };
