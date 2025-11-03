// providers/vfs.js
// VFS Global sağlayıcısından randevu kontrolü (ESM versiyon)

import { fetchPage, containsPattern } from './genericHttp.js';

/**
 * VFS Global randevu kontrolü
 * @param {Object} params
 * @param {string} params.city - Şehir (örnek: Ankara)
 * @param {string} params.missionCode - Ülke kodu (örnek: nld, nor, swe)
 * @returns {Promise<Availability[]>}
 */
export async function checkAvailability({ city, missionCode }) {
  const baseUrl = `https://visa.vfsglobal.com/${missionCode}/tr/${city}/book-an-appointment`;
  const html = await fetchPage(baseUrl);

  if (!html) {
    return [{
      provider: 'vfs',
      missionCode,
      city,
      status: 'unknown',
      date: null,
      note: 'Veri alınamadı'
    }];
  }

  if (containsPattern(html, /no slots available|no appointments|dolu/i)) {
    return [{
      provider: 'vfs',
      missionCode,
      city,
      status: 'closed',
      date: null,
      note: 'Boş randevu yok'
    }];
  }

  if (containsPattern(html, /appointment available|available slots|randevu alınabilir/i)) {
    return [{
      provider: 'vfs',
      missionCode,
      city,
      status: 'open',
      date: new Date().toISOString(),
      note: 'Boş randevu mevcut'
    }];
  }

  return [{
    provider: 'vfs',
    missionCode,
    city,
    status: 'unknown',
    date: null,
    note: 'Durum tespit edilemedi'
  }];
}
