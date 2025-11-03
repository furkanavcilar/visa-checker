// interactiveBot.js (CommonJS, Node.js)
// Paste this file into your repo root and set Railway start command to: node interactiveBot.js

require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// providers registry - repo'da varsa kullanacağız
// registry.js export: module.exports = { queryAllProviders: async function(params) { ... } }
let queryAllProviders;
try {
  queryAllProviders = require('./providers/registry').queryAllProviders;
} catch (err) {
  console.error('providers/registry.js yüklenemedi. queryAllProviders bulunamadı. Hata:', err.message);
  // fallback: dummy function so bot doesn't crash immediately
  queryAllProviders = async () => { return []; };
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || null;
const POLL_INTERVAL_MS = parseInt(process.env.TELEGRAM_POLL_INTERVAL_MS || '1000', 10);
const TARGET_COUNTRIES = (process.env.TARGET_COUNTRY || '').split(',').map(s => s.trim()).filter(Boolean); // e.g. "ita,fra,nld"
const MISSION_COUNTRY = process.env.MISSION_COUNTRY || ''; // e.g. "ita,nld,fra"
const CITIES = (process.env.CITIES || '').split(',').map(s => s.trim()).filter(Boolean); // "Ankara,Istanbul"

if (!TOKEN) {
  console.error('HATA: TELEGRAM_BOT_TOKEN çevre değişkeni yok. Railway Variables kısmına ekle.');
  process.exit(1);
}

console.log('Starting Container');
(async function start() {
  try {
    // 1) Ensure any existing webhook is deleted on Telegram side so polling works
    try {
      const deleteUrl = `https://api.telegram.org/bot${TOKEN}/deleteWebhook`;
      const res = await axios.get(deleteUrl);
      console.log('deleteWebhook response:', res.data && res.data.description || res.data);
    } catch (e) {
      console.warn('deleteWebhook hatası (devam ediyorum):', e.message);
    }

    // 2) create bot with polling
    const bot = new TelegramBot(TOKEN, {
      polling: {
        interval: POLL_INTERVAL_MS,
        retryAfter: 30,
        params: {},
      }
    });

    let oneInstanceStarted = true;
    bot.on('polling_error', (err) => {
      console.error('Polling hatası:', err && err.code, err && err.response && err.response.data || err && err.message || err);
      // ETELEGRAM 409 Conflict -> genelde başka getUpdates/polling instance var demek
      // Log'la ama bot'u kapatmıyoruz; opsiyonel: process.exit(1) ile yeniden deploy vs.
    });

    bot.on('webhook_error', (err) => {
      console.error('Webhook hatası:', err);
    });

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Merhaba! Ne yapmak istiyorsun?', {
        reply_markup: {
          keyboard: [['Randevu Sorgulama']],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      });
    });

    bot.on('message', async (msg) => {
      try {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();

        if (text === 'Randevu Sorgulama') {
          // Show target countries from env or default list
          const countries = TARGET_COUNTRIES.length ? TARGET_COUNTRIES : ['ita','esp','nld','deu','fra','swe','nor'];
          const buttons = countries.map(c => [{ text: c }]);
          await bot.sendMessage(chatId, 'Hangi ülkenin randevusunu sorgulamak istiyorsun? (kısaltma kullanabilirsin)', {
            reply_markup: {
              keyboard: buttons,
              resize_keyboard: true,
              one_time_keyboard: false
            }
          });
          return;
        }

        // if user sends country code like "ita" or city name
        if (text.length > 0) {
          // treat as a query: attempt to call providers
          await bot.sendMessage(chatId, `Sorguluyorum: "${text}". Birkaç saniye bekle...`);
          const params = {
            countryCode: text, // provider'lar bu param'ı bekliyor olabilir
            city: CITIES[0] || undefined,
            visaType: process.env.VISA_TYPE || 'short-stay',
            // missionCodes must be iterable: ensure array
            missionCodes: (process.env.MISSION_COUNTRY || '').split(',').map(s => s.trim()).filter(Boolean)
          };

          // safety: if missionCodes empty -> fallback: [text] where text looks like country code
          if (!Array.isArray(params.missionCodes) || params.missionCodes.length === 0) {
            params.missionCodes = [ text ];
          }

          try {
            const results = await queryAllProviders(params);
            if (!results || results.length === 0) {
              await bot.sendMessage(chatId, 'Hiç boş randevu bulunamadı. Tekrar deneyin veya farklı ülke/sehir seçin.');
            } else {
              // results: array of { provider, date, details } - adapt as providers return
              const lines = results.slice(0, 10).map(r => {
                if (typeof r === 'string') return r;
                const provider = r.provider || r.source || 'provider';
                const date = r.date || r.slot || r.available || 'tarih yok';
                return `${provider}: ${date} ${r.details ? '- ' + r.details : ''}`;
              });
              await bot.sendMessage(chatId, `Bulunan sonuçlar:\n\n${lines.join('\n')}`);
            }
          } catch (err) {
            console.error('Sorgu hatası:', err && err.stack || err);
            await bot.sendMessage(chatId, `Sorgu hatası: ${err && err.message ? err.message : 'Bilinmeyen hata'}`);
          }
        }

      } catch (err) {
        console.error('message handler hatası:', err);
      }
    });

    bot.on('polling_error', (err) => {
      console.error('polling_error (2):', err);
    });

    // bot started
    bot.getMe().then((me) => {
      console.log('✅ Telegram bot başlatıldı (tek instance). Bot kullanıcı adı:', me.username);
      if (CHAT_ID) {
        bot.sendMessage(CHAT_ID, `Bot başlatıldı: ${me.username}`);
      }
    }).catch(err => {
      console.warn('getMe hatası:', err && err.message);
    });

    // graceful shutdown
    process.on('SIGINT', () => {
      console.log('SIGINT alındı - bot kapanıyor');
      bot.stopPolling();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      console.log('SIGTERM alındı - bot kapanıyor');
      bot.stopPolling();
      process.exit(0);
    });

  } catch (err) {
    console.error('Başlangıç hatası:', err && err.stack || err);
    process.exit(1);
  }
})();
