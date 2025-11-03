// providers/idata.js
// iDATA sağlayıcısından randevu kontrolü

const { fetchPage, containsPattern } = require('./genericHttp');

/**
 * iDATA sitesi üzerinden boş randevu kontrolü
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Ankara)
 * @param {string} params.missionCode - Ülke kodu (örnek: ita, deu)
 * @returns {Promise<Availability[]>}
 */
async function checkAvailability({ city, missionCode }) {
  const baseUrl = `https://idata.com.tr/${missionCode}/${city}/appointment`;
  const html = await fetchPage(baseUrl);

  if (!html) {
    return [{
      provider: 'idata',
      missionCode,
      city,
      status: 'unknown',
      date: null,
      note: 'Veri alınamadı'
    }];
  }

  // HTML içinde "no appointments" ifadesi varsa dolu değil
  if (containsPattern(html, /no\s*appointments|no slots available|dolu/i)) {
    return [{
      provider: 'idata',
      missionCode,
      city,
      status: 'closed',
      date: null,
      note: 'Boş randevu yok'
    }];
  }

  // Eğer "appointment available" tarzı metin varsa açık
  if (containsPattern(html, /appointment available|available slots/i)) {
    return [{
      provider: 'idata',
      missionCode,
      city,
      status: 'open',
      date: new Date().toISOString(),
      note: 'Boş randevu mevcut'
    }];
  }

  // Hiçbiri bulunamazsa bilinmiyor
  return [{
    provider: 'idata',
    missionCode,
    city,
    status: 'unknown',
    date: null,
    note: 'Durum tespit edilemedi'
  }];
}

module.exports = { checkAvailability };
