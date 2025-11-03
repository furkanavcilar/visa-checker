// registry.js
// Tüm provider modüllerini tek yerde toplayan yapı (ESM sürümü)

import * as idata from './idata.js';
import * as vfs from './vfs.js';
import * as tls from './tls.js';
import * as bls from './bls.js';

export async function queryAllProviders(params) {
  const providers = [idata, vfs, tls, bls];
  const results = [];

  for (const provider of providers) {
    try {
      const response = await provider.checkAvailability(params);
      results.push(...response);
    } catch (err) {
      console.error(`[HTTP ERROR] ${err.message}`);
    }
  }

  return results;
}
