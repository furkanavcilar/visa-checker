// providers/visasbot.js
const axios = require('axios');

/**
 * visasbot endpointinden veriyi çeker ve normalize eder
 * env: VISA_API_URL (örn: https://api.visasbot.com/api/visa/list)
 * @returns {Promise<Availability[]>}
 */
async function checkAvailability({ countryCode, city, visaType }) {
  const url = process.env.VISA_API_URL || 'https://api.visasbot.com/api/visa/list';
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (!Array.isArray(raw)) return [];

    const out = raw
      .filter(a => a && (a.status === 'open' || a.status === 'waitlist_open'))
      .filter(a => {
        // mission (hedef ülke) filtre
        if (countryCode && countryCode.toLowerCase() !== 'all') {
          if (!a.mission_code || a.mission_code.toLowerCase() !== countryCode.toLowerCase()) return false;
        }
        // şehir filtre
        if (city) {
          const center = (a.center || '').toLowerCase();
          if (!center.includes(city.toLowerCase())) return false;
        }
        // vize tipi filtre
        if (visaType) {
          const vt = (a.visa_type || '').toLowerCase();
          if (!vt.includes(visaType.toLowerCase())) return false;
        }
        return true;
      })
      .map(a => ({
        provider: 'visasbot',
        missionCode: a.mission_code || '',
        center: a.center || '',
        visaType: a.visa_type || '',
        status: a.status || '',
        date: a.date || a.last_available || a.last_checked_at || ''
      }));

    return out;
  } catch (e) {
    console.error('[visasbot] hata:', e?.message || e);
    return [];
  }
}

module.exports = { checkAvailability };
