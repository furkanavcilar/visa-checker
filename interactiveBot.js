require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { queryAllProviders } = require('./providers/registry');

// --- Bot'u Tekil Başlat ---
let bot;
if (!global.botInstance) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  global.botInstance = bot;
  console.log('✅ Telegram bot başlatıldı (tek instance).');
} else {
  bot = global.botInstance;
  console.log('⚠️ Bot zaten aktif, yeni instance başlatılmadı.');
}

// --- Komutlar ve Etkileşimler ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      keyboard: [
        [{ text: '🇮🇹 İtalya' }],
        [{ text: '🇫🇷 Fransa' }],
        [{ text: '🇩🇪 Almanya' }],
        [{ text: '🇳🇱 Hollanda' }],
        [{ text: '🇪🇸 İspanya' }],
        [{ text: '🇸🇪 İsveç' }],
        [{ text: '🇳🇴 Norveç' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  await bot.sendMessage(chatId, 'Merhaba 👋\nHangi ülkenin vize randevusunu sorgulamak istiyorsunuz?', opts);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  const countries = {
    '🇮🇹 İtalya': 'ita',
    '🇫🇷 Fransa': 'fra',
    '🇩🇪 Almanya': 'deu',
    '🇳🇱 Hollanda': 'nld',
    '🇪🇸 İspanya': 'esp',
    '🇸🇪 İsveç': 'swe',
    '🇳🇴 Norveç': 'nor',
  };

  if (countries[text]) {
    const countryCode = countries[text];
    await bot.sendMessage(chatId, `🔍 ${text} için uygun randevular aranıyor...`);

    try {
      const results = await queryAllProviders({ countryCode });
      if (results.length === 0) {
        await bot.sendMessage(chatId, `❌ Şu anda ${text} için boş randevu bulunamadı.`);
      } else {
        let reply = `✅ ${text} için bulunan randevular:\n\n`;
        for (const r of results) {
          reply += `📅 ${r.date} - ${r.city}\n`;
        }
        await bot.sendMessage(chatId, reply);
      }
    } catch (err) {
      console.error('Sorgu hatası:', err);
      await bot.sendMessage(chatId, '⚠️ Randevu sorgusu sırasında hata oluştu, lütfen tekrar deneyin.');
    }
  }
});

// --- Hata Yönetimi ---
bot.on('polling_error', (error) => {
  console.error('Polling hatası:', error.code, error.message);
});

process.on('uncaughtException', (err) => {
  console.error('Beklenmeyen hata:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Yakalanmamış Promise hatası:', reason);
});
