// interactiveBot.js (ESM, Node.js 18+)
import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import { queryAllProviders } from './providers/registry.js';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || null;
const POLL_INTERVAL_MS = parseInt(process.env.TELEGRAM_POLL_INTERVAL_MS || '1000', 10);
const TARGET_COUNTRIES = (process.env.TARGET_COUNTRY || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const MISSION_COUNTRY = process.env.MISSION_COUNTRY || '';
const CITIES = (process.env.CITIES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!TOKEN) {
  console.error('HATA: TELEGRAM_BOT_TOKEN çevre değişkeni yok. Railway Variables kısmına ekle.');
  process.exit(1);
}

console.log('Starting Container');

(async function start() {
  try {
    // 1) Webhook kaldırma
    try {
      const deleteUrl = `https://api.telegram.org/bot${TOKEN}/deleteWebhook`;
      const res = await axios.get(deleteUrl);
      console.log('deleteWebhook response:', res.data?.description || res.data);
    } catch (e) {
      console.warn('deleteWebhook hatası (devam ediyorum):', e.message);
    }

    // 2) Botu oluştur
    const bot = new TelegramBot(TOKEN, {
      polling: {
        interval: POLL_INTERVAL_MS,
        retryAfter: 30,
        params: {}
      }
    });

    bot.on('polling_error', (err) => {
      console.error('Polling hatası:', err?.code, err?.response?.data || err?.message || err);
    });

    bot.on('webhook_error', (err) => {
      console.error('Webhook hatası:', err);
    });

    // /start komutu
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

    // Mesaj dinleyici
    bot.on('message', async (msg) => {
      try {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();

        if (text === 'Randevu Sorgulama') {
          const countries = TARGET_COUNTRIES.length
            ? TARGET_COUNTRIES
            : ['ita', 'esp', 'nld', 'deu', 'fra', 'swe', 'nor'];

          const buttons = countries.map(c => [{ text: c }]);
          await bot.sendMessage(
            chatId,
            'Hangi ülkenin randevusunu sorgulamak istiyorsun? (kısaltma kullanabilirsin)',
            {
              reply_markup: {
                keyboard: buttons,
                resize_keyboard: true,
                one_time_keyboard: false
              }
            }
          );
          return;
        }

        if (text.length > 0) {
          await bot.sendMessage(chatId, `Sorguluyorum: "${text}". Birkaç saniye bekle...`);

          const params = {
            countryCode: text,
            city: CITIES[0] || undefined,
            visaType: process.env.VISA_TYPE || 'short-stay',
            missionCodes: (process.env.MISSION_COUNTRY || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          };

          if (!params.missionCodes.length) params.missionCodes = [text];

          try {
            const results = await queryAllProviders(params);
            if (!results || results.length === 0) {
              await bot.sendMessage(
                chatId,
                'Hiç boş randevu bulunamadı. Tekrar deneyin veya farklı ülke/sehir seçin.'
              );
            } else {
              const lines = results.slice(0, 10).map(r => {
                if (typeof r === 'string') return r;
                const provider = r.provider || r.source || 'provider';
                const date = r.date || r.slot || r.available || 'tarih yok';
                return `${provider}: ${date} ${r.details ? '- ' + r.details : ''}`;
              });
              await bot.sendMessage(chatId, `Bulunan sonuçlar:\n\n${lines.join('\n')}`);
            }
          } catch (err) {
            console.error('Sorgu hatası:', err);
            await bot.sendMessage(chatId, `Sorgu hatası: ${err.message || 'Bilinmeyen hata'}`);
          }
        }
      } catch (err) {
        console.error('message handler hatası:', err);
      }
    });

    // Bot başlatıldı logu
    bot.getMe()
      .then((me) => {
        console.log(`✅ Telegram bot başlatıldı (tek instance). Bot kullanıcı adı: ${me.username}`);
        if (CHAT_ID) bot.sendMessage(CHAT_ID, `Bot başlatıldı: ${me.username}`);
      })
      .catch(err => console.warn('getMe hatası:', err?.message));

    // Graceful shutdown
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
    console.error('Başlangıç hatası:', err);
    process.exit(1);
  }
})();
