// providers/genericHttp.js
// Genel HTTP istek fonksiyonu - axios kullanır

const axios = require('axios');

/**
 * Basit HTTP GET isteği yapar ve sonucu döner
 * @param {string} url - Sorgulanacak URL
 * @param {object} headers - Ek header bilgileri (opsiyonel)
 * @returns {Promise<any>}
 */
async function fetchPage(url, headers = {}) {
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`[HTTP ERROR] ${url}`, error.message);
    return null;
  }
}

/**
 * HTML içeriğinden belirli bir anahtar kelimenin var olup olmadığını kontrol eder
 * @param {string} html - Gelen HTML içeriği
 * @param {RegExp|string} pattern - Aranacak metin veya regex
 * @returns {boolean}
 */
function containsPattern(html, pattern) {
  if (!html) return false;
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  return regex.test(html);
}

module.exports = {
  fetchPage,
  containsPattern,
};
