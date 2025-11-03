// providers/types.js
/**
 * @typedef {Object} Availability
 * @property {string} provider      // "visasbot" gibi
 * @property {string} missionCode   // "ita", "esp" vs (kaynakta ne geçiyorsa)
 * @property {string} center        // Ankara / İstanbul / İzmir...
 * @property {string} visaType      // Tourism / Business...
 * @property {string} status        // open | waitlist_open | closed...
 * @property {string} date          // "2025-11-15" gibi (bilinmiyorsa "")
 */
