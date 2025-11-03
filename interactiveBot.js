// interactiveBot.js
const TelegramBot = require('node-telegram-bot-api');
const { checkAvailability } = require('./providers/visasbot');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Minimalist buton listesi
const countries = [
  { code: 'ita', name: 'İtalya' },
  { code: 'esp', name: 'İspanya' },
  { code: 'nld', name: 'Hollanda' },
  { code: 'deu', name: 'Almanya' },
  { code: 'fra', name: 'Fransa' },
  { code: 'swe', name: 'İsveç' },
  { code: 'nor', name: 'Norveç' },
];

const cities = ['Istanbul', 'Ankara'];

// Başlangıç mesajı
bot.onText(/\/start/, async (msg) => {
  const opts = {
    reply_markup: {
      keyboard: [['Randevu Sorgulama']],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
  await bot.sendMessage(msg.chat.id, 'Merhaba 👋 Ne yapmak istiyorsun?', opts);
});

// Randevu sorgulama başlatma
bot.on('message', async (msg) => {
  if (msg.text === 'Randevu Sorgulama') {
    const buttons = countries.map((c) => [{ text: c.name }]);
    await bot.sendMessage(msg.chat.id, 'Hangi ülkenin randevusunu sorgulamak istiyorsun?', {
      reply_markup: { keyboard: buttons, resize_keyboard: true },
    });
  }

  const selectedCountry = countries.find((c) => c.name === msg.text);
  if (selectedCountry) {
    await bot.sendMessage(msg.chat.id, `🔍 ${selectedCountry.name} için şehir seçiniz:`, {
      reply_markup: {
        keyboard: cities.map((c) => [{ text: c }]),
        resize_keyboard: true,
      },
    });
    bot.once('message', async (cityMsg) => {
      const city = cityMsg.text;
      await bot.sendMessage(msg.chat.id, `⏳ ${selectedCountry.name} (${city}) için randevu kontrol ediliyor...`);

      try {
        const results = await checkAvailability({
          missionCodes: [selectedCountry.code],
          city,
        });

        if (!results || results.length === 0) {
          await bot.sendMessage(msg.chat.id, '⚠️ Hiç veri bulunamadı.');
          return;
        }

        let text = `📅 ${selectedCountry.name} (${city}) sonuçları:\n\n`;
        for (const r of results) {
          text += `🌐 ${r.provider.toUpperCase()} — ${r.status === 'open' ? '🟢 Müsait' : '🔴 Kapalı'}\n`;
          if (r.date) text += `📆 Tarih: ${r.date}\n`;
          if (r.note) text += `📝 ${r.note}\n`;
          text += '\n';
        }

        await bot.sendMessage(msg.chat.id, text);
      } catch (err) {
        console.error(err);
        await bot.sendMessage(msg.chat.id, '🚨 Bir hata oluştu, lütfen tekrar deneyin.');
      }
    });
  }
});
