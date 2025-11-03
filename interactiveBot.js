// interactiveBot.js
const TelegramBot = require('node-telegram-bot-api');
const { queryAllProviders } = require('./providers/registry');

// === Ortam değişkenleri ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN bulunamadı!');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// === Kullanıcı durumu ===
const userStates = new Map();

// === Ülke listesi (örnek) ===
const COUNTRIES = {
  ita: 'İtalya',
  esp: 'İspanya',
  nld: 'Hollanda',
  deu: 'Almanya',
  fra: 'Fransa',
  swe: 'İsveç',
  nor: 'Norveç'
};

// === Başlangıç komutu ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates.delete(chatId);
  bot.sendMessage(chatId, "Merhaba! Ne yapmak istiyorsunuz?\n\n• Randevu Sorgulama", {
    reply_markup: {
      keyboard: [['Randevu Sorgulama']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// === Randevu sorgulama akışı ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const state = userStates.get(chatId) || {};

  if (text === 'Randevu Sorgulama') {
    state.step = 'country';
    userStates.set(chatId, state);
    const countryButtons = Object.entries(COUNTRIES).map(([code, name]) => [{ text: name, callback_data: code }]);
    bot.sendMessage(chatId, 'Hangi ülkenin randevusunu sorgulamak istiyorsunuz?', {
      reply_markup: {
        keyboard: Object.values(COUNTRIES).map(v => [v]),
        resize_keyboard: true
      }
    });
    return;
  }

  // === Ülke seçimi ===
  if (state.step === 'country') {
    const selected = Object.entries(COUNTRIES).find(([code, name]) => name === text);
    if (!selected) {
      bot.sendMessage(chatId, 'Lütfen geçerli bir ülke seçin.');
      return;
    }
    state.countryCode = selected[0];
    state.step = 'city';
    bot.sendMessage(chatId, `Seçtiğiniz ülke: ${selected[1]}\n\nHangi şehir için sorgulama yapmak istiyorsunuz?\n(örnek: Ankara veya "atla" yazabilirsiniz)`);
    return;
  }

  // === Şehir seçimi ===
  if (state.step === 'city') {
    if (text.toLowerCase() === 'atla') {
      state.city = '';
    } else {
      state.city = text;
    }
    state.step = 'visaType';
    bot.sendMessage(chatId, `Hangi vize türü için sorgulamak istiyorsunuz?\n(örnek: Tourism, Student, Job Seeker veya "atla")`);
    return;
  }

  // === Vize tipi seçimi ===
  if (state.step === 'visaType') {
    if (text.toLowerCase() === 'atla') {
      state.visaType = '';
    } else {
      state.visaType = text;
    }

    bot.sendMessage(chatId, '🔍 Vize randevuları sorgulanıyor, lütfen bekleyin...');

    const params = {
      countryCode: state.countryCode,
      city: state.city,
      visaType: state.visaType
    };

    try {
      const results = await queryAllProviders(params);
      const formatted = formatResults(results);
      bot.sendMessage(chatId, formatted);
    } catch (err) {
      console.error('Hata:', err);
      bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }

    userStates.delete(chatId);
  }
});

// === Yardımcı fonksiyon ===
function formatResults(results) {
  if (!results || results.length === 0)
    return 'Kriterlere uygun boş randevu bulunamadı.';

  const max = 10;
  const lines = results.slice(0, max).map(r =>
    `• [${r.provider}] ${r.missionCode.toUpperCase()} — ${r.center} — ${r.visaType} — ${r.status}${r.date ? ' — ' + r.date : ''}`
  );
  if (results.length > max)
    lines.push(`...ve ${results.length - max} daha.`);
  return `Bulunan randevular (${results.length}):\n${lines.join('\n')}`;
}

console.log('✅ Telegram bot başlatıldı...');
