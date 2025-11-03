// providers/types.js
// Ortak tip tanımları

/**
 * @typedef {Object} Availability
 * @property {string} provider - Sağlayıcı (idata, vfs, tls, bls)
 * @property {string} missionCode - Ülke kodu (örnek: ita, fra, nld)
 * @property {string} city - Şehir (örnek: Istanbul, Ankara)
 * @property {'open' | 'closed' | 'unknown'} status - Randevu durumu
 * @property {string | null} date - Randevu tarihi (boşsa null)
 * @property {string} note - Ek açıklama
 */

module.exports = {};
