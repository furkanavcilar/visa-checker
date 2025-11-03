// interactiveBot.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// CONFIG from env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_CHAT_ID; // admin'e bildirim atıyoruz
const VISA_API_URL = process.env.VISA_API_URL || 'https://api.visasbot.com/api/visa/list';
const MISSION_COUNTRY_ENV = process.env.MISSION_COUNTRY || ''; // e.g. "nld,fra,deu"
const DEBUG = (process.env.DEBUG || 'false').toLowerCase() === 'true';

if (!BOT_TOKEN || !ADMIN_ID) {
  console.error('Eksik çevre değişkenleri: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userStates = {}; // { chatId: { step: 'selectAction'|'selectCountry'|'selectCity'|'selectVisa', selections: {} } }

// Utility: format results to message (limit)
function formatResults(results) {
  if (!results || results.length === 0) {
    return 'Aranan kriterlere uygun boş randevu bulunamadı.';
  }
  const max = 8;
  const slice = results.slice(0, max);
  const lines = slice.map(r => {
    // adapt these fields depending on API response
    const date = r.date || r.last_available || r.last_checked_at || '';
    const center = r.center || r.place || '';
    const mission = r.mission_code || '';
    const status = r.status || '';
    const visaType = r.visa_type || '';
    return `• ${mission.toUpperCase()} — ${center} — ${visaType} — ${date} — ${status}`;
  });
  if (results.length > max) lines.push(`...ve ${results.length - max} daha bulundu.`);
  return `Bulunan randevular (${results.length}):\n` + lines.join('\n');
}

// API call + client-side filtering
async function queryAppointments({ missionCode, city, visaType }) {
  try {
    if (DEBUG) console.log('API çağrısı yapılıyor:', VISA_API_URL);
    const res = await axios.get(VISA_API_URL, { timeout: 15000 });
    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (!Array.isArray(data)) return [];

    const filtered = data.filter(a => {
      // status filter
      if (a.status !== 'open' && a.status !== 'waitlist_open') return false;

      // mission country (target country code)
      if (missionCode && missionCode.toLowerCase() !== 'all') {
        if (!a.mission_code || a.mission_code.toLowerCase() !== missionCode.toLowerCase()) return false;
      }

      // city: try to extract from center or center field contains
      if (city) {
        const center = (a.center || '').toLowerCase();
        if (!center.includes(city.toLowerCase())) return false;
      }

      // visa type
      if (visaType) {
        const vt = (a.visa_type || '').toLowerCase();
        if (!vt.includes(visaType.toLowerCase())) return false;
      }

      return true;
    });

    if (DEBUG) console.log('Filtrelenmiş sonuç sayısı:', filtered.length);
    return filtered;
  } catch (err) {
    console.error('API sorgu hatası:', err?.message || err);
    return [];
  }
}

// Build keyboard from MISSION_COUNTRY env
function getMissionOptions() {
  const codes = MISSION_COUNTRY_ENV.split(',').map(s => s.trim()).filter(Boolean);
  if (codes.length === 0) return [['all']];
  // arrange in rows of 3
  const rows = [];
  for (let i=0;i<codes.length;i+=3) rows.push(codes.slice(i,i+3));
  return rows;
}

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: 'selectAction', selections: {} };
  bot.sendMessage(chatId, 'Merhaba! Ne yapmak istiyorsunuz?', {
    reply_markup: {
      keyboard: [['Randevu Sorgulama']],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// message handler (reply-keyboard flow)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!userStates[chatId]) {
    // ignore or ask to /start
    return;
  }
  const state = userStates[chatId];

  // step1: action selection
  if (state.step === 'selectAction') {
    if (text === 'Randevu Sorgulama') {
      // show mission options (codes from env)
      const keyboard = getMissionOptions();
      bot.sendMessage(chatId, 'Hangi ülkenin randevusunu sorgulamak istiyorsunuz? (kod ile)', {
        reply_markup: {
          keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
      state.step = 'selectCountry';
      return;
    } else {
      bot.sendMessage(chatId, 'Lütfen "/start" ile başlayıp "Randevu Sorgulama" seçeneğini seçin.');
      return;
    }
  }

  // step2: mission/country selected (we expect a code like nld,fra or "all")
  if (state.step === 'selectCountry') {
    const selected = text;
    state.selections.missionCode = selected;
    bot.sendMessage(chatId, `Seçtiğiniz ülke: ${selected}`);
    // notify admin
    bot.sendMessage(ADMIN_ID, `Kullanıcı @${msg.from.username || msg.from.id} (${chatId}) ${selected} ülkesini seçti.`);
    // ask city (optional) or let user type "skip"
    bot.sendMessage(chatId, 'Arama şehir bazında olsun mu? Şehir adı yazın veya "atla" yazın.', {
      reply_markup: {
        keyboard: [['atla']],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
    state.step = 'selectCity';
    return;
  }

  // step3: city
  if (state.step === 'selectCity') {
    const cityText = text.toLowerCase();
    if (cityText === 'atla') {
      state.selections.city = undefined;
    } else {
      state.selections.city = text;
    }
    // ask visa type (optional)
    bot.sendMessage(chatId, 'Vize tipi (ör: Tourism, Business) yazın veya "atla" yazın.');
    state.step = 'selectVisa';
    return;
  }

  // step4: visa type -> perform search
  if (state.step === 'selectVisa') {
    const visaText = text.toLowerCase();
    if (visaText === 'atla') state.selections.visaType = undefined;
    else state.selections.visaType = text;

    // now query API
    bot.sendMessage(chatId, 'Sorgunuz alındı. Randevu kontrolü yapılıyor, lütfen bekleyin...');
    const params = {
      missionCode: state.selections.missionCode,
      city: state.selections.city,
      visaType: state.selections.visaType
    };
    const results = await queryAppointments(params);

    // send results to user
    const msgToUser = formatResults(results);
    bot.sendMessage(chatId, msgToUser);

    // notify admin
    bot.sendMessage(ADMIN_ID, `Kullanıcı @${msg.from.username || msg.from.id} (${chatId}) sorgu yaptı: ${JSON.stringify(params)}. Sonuç sayısı: ${results.length}`);

    // clear state
    delete userStates[chatId];
    return;
  }
});

// simple error logging
bot.on('polling_error', (err) => {
  console.error('polling_error', err);
});

console.log('Interactive bot started and polling for messages...');

update: real visa API integration





