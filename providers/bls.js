// providers/bls.js
// BLS International randevu kontrolü

const { fetchPage, containsPattern } = require('./genericHttp');

/**
 * BLS International randevu kontrolü
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Istanbul)
 * @param {string} params.missionCode - Ülke kodu (örnek: esp, pol)
 * @returns {Promise<Availability[]>}
 */
async function checkAvailability({ city, missionCode }) {
  const baseUrl = `https://bls${missionCode}.com/book-appointment`;
  const html = await fetchPage(baseUrl);

  if (!html) {
    return [{
      provider: 'bls',
      missionCode,
      city,
      status: 'unknown',
      date: null,
      note: 'Veri alınamadı'
    }];
  }

  if (containsPattern(html, /no appointment|dolu|no slot available|no time/i)) {
    return [{
      provider: 'bls',
      missionCode,
      city,
      status: 'closed',
      date: null,
      note: 'Boş randevu yok'
    }];
  }

  if (containsPattern(html, /appointment available|available now|slot available/i)) {
    return [{
      provider: 'bls',
      missionCode,
      city,
      status: 'open',
      date: new Date().toISOString(),
      note: 'Boş randevu mevcut'
    }];
  }

  return [{
    provider: 'bls',
    missionCode,
    city,
    status: 'unknown',
    date: null,
    note: 'Durum tespit edilemedi'
  }];
}

module.exports = { checkAvailability };
