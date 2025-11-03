// providers/registry.js
const visasbot = require('./visasbot');

/**
 * yeni provider eklemek için bu diziye ekle:
 * { name: 'vfs', mod: require('./vfs') }
 */
const PROVIDERS = [
  { name: 'visasbot', mod: visasbot },
];

/**
 * tüm providerları dolaş, sonuçları topla
 * @param {{countryCode?: string, city?: string, visaType?: string}} params
 */
async function queryAllProviders(params) {
  const results = [];
  for (const p of PROVIDERS) {
    try {
      const r = await p.mod.checkAvailability(params);
      if (Array.isArray(r) && r.length) results.push(...r);
    } catch (e) {
      console.error(`[registry] ${p.name} çalışırken hata:`, e?.message || e);
    }
  }
  return results;
}

module.exports = { queryAllProviders };
