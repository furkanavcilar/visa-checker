// providers/tls.js
// TLS Contact sağlayıcısından randevu kontrolü (ESM versiyon)

import { fetchPage, containsPattern } from './genericHttp.js';

/**
 * TLS Contact üzerinden randevu kontrolü
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Ankara)
 * @param {string} params.missionCode - Ülke kodu (örnek: ita, deu, fra)
 * @returns {Promise<Availability[]>}
 */
export async function checkAvailability({ city, missionCode }) {
  const baseUrl = `https://${missionCode}.tlscontact.com/tr/${city}/login.php`;
  const html = await fetchPage(baseUrl);

  if (!html) {
    return [{
      provider: 'tls',
      missionCode,
      city,
      status: 'unknown',
      date: null,
      note: 'Veri alınamadı'
    }];
  }

  if (containsPattern(html, /no appointment available|no slots|dolu|not available/i)) {
    return [{
      provider: 'tls',
      missionCode,
      city,
      status: 'closed',
      date: null,
      note: 'Boş randevu yok'
    }];
  }

  if (containsPattern(html, /appointment available|available now|slot available/i)) {
    return [{
      provider: 'tls',
      missionCode,
      city,
      status: 'open',
      date: new Date().toISOString(),
      note: 'Boş randevu mevcut'
    }];
  }

  return [{
    provider: 'tls',
    missionCode,
    city,
    status: 'unknown',
    date: null,
    note: 'Durum tespit edilemedi'
  }];
}
