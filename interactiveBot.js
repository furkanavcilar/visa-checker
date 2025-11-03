const TelegramBot = require('node-telegram-bot-api');

// Bot token
const BOT_TOKEN = '8013255951:AAEZ6p8C9qPVUl1-9MN-nWMK6tjD_uscTlI';
// Admin ID (senin ID’n)
const ADMIN_ID = 840313159;

// Botu başlat
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Kullanıcı state'lerini tutmak için basit object
const userStates = {};

// /start komutu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Kullanıcıya mesaj gönder
  bot.sendMessage(chatId, 'Merhaba! Ne yapmak istiyorsunuz?', {
    reply_markup: {
      keyboard: [['Randevu Sorgulama']],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });

  // Kullanıcının state'ini başlat
  userStates[chatId] = { step: 'selectAction' };
});

// Kullanıcıdan gelen mesajları dinle
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Eğer kullanıcı state yoksa /start ile başlat
  if (!userStates[chatId]) return;

  const state = userStates[chatId];

  // 1️⃣ Adım: Randevu Sorgulama seçildi mi?
  if (state.step === 'selectAction' && text === 'Randevu Sorgulama') {
    bot.sendMessage(chatId, 'Hangi ülkenin randevusunu sorgulamak istiyorsunuz?', {
      reply_markup: {
        keyboard: [['Türkiye', 'Hollanda', 'Fransa']],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    state.step = 'selectCountry';
    return;
  }

  // 2️⃣ Adım: Ülke seçildi
  if (state.step === 'selectCountry' && ['Türkiye', 'Hollanda', 'Fransa'].includes(text)) {
    const selectedCountry = text;

    // Kullanıcıya cevap
    bot.sendMessage(chatId, `Seçtiğiniz ülke: ${selectedCountry}`);

    // Admin’e bildir
    bot.sendMessage(ADMIN_ID, `Kullanıcı @${msg.from.username} (${chatId}) ${selectedCountry} ülkesini seçti.`);

    // State temizle veya bir sonraki adım ekle
    delete userStates[chatId];
    return;
  }
});
