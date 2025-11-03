// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";
import { PROVIDERS } from "./providers";

// ENV kontrolü
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Hata: TELEGRAM_BOT_TOKEN .env içinde tanımlı değil.");
  process.exit(1);
}

// Botu başlat (polling)
const bot = new TelegramBot(token, { polling: true });

// Yardımcı: ülke listesini inline keyboard için hazırla
function buildCountryKeyboard() {
  // PROVIDERS key'lerini sırala (dilediğin sıraya göre)
  const keys = Object.keys(PROVIDERS);

  // Telegram inline keyboard: her satırda 2 buton göster (isteğe göre ayarla)
  const rows: { text: string; callback_data?: string; url?: string }[][] = [];
  for (let i = 0; i < keys.length; i += 2) {
    const row: { text: string; callback_data?: string; url?: string }[] = [];

    for (let j = 0; j < 2; j++) {
      const k = keys[i + j];
      if (!k) continue;
      const p = PROVIDERS[k];
      // Buton text: bayrak emojisi + ülke adı — emoji'leri isteğe göre özelleştir
      const emoji = countryFlagEmoji(k) || "";
      row.push({
        text: `${emoji} ${p.name}`,
        callback_data: `country:${p.code}`,
      });
    }
    rows.push(row);
  }

  return { reply_markup: { inline_keyboard: rows } };
}

// Basit bayrak emoji eşlemeleri (kısa)
function countryFlagEmoji(code: string) {
  const map: Record<string, string> = {
    nld: "🇳🇱",
    deu: "🇩🇪",
    fra: "🇫🇷",
    ita: "🇮🇹",
    esp: "🇪🇸",
    swe: "🇸🇪",
    nor: "🇳🇴",
    tur: "🇹🇷",
  };
  return map[code.toLowerCase()] || "";
}

// /start handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `Merhaba! Hangi ülkenin vize randevularını kontrol etmek istersin? Butonlardan birini seç:`,
    buildCountryKeyboard()
  );
});

// ayrıca /countries komutu
bot.onText(/\/countries/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `Lütfen bir ülke seçin:`,
    buildCountryKeyboard()
  );
});

// callback_query handler — kullanıcı ülke seçtiğinde => sağlayıcı linklerini URL butonu olarak gönder
bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  if (!data || !chatId) return;

  // örn: country:nld
  if (data.startsWith("country:")) {
    const code = data.split(":")[1];
    const provider = PROVIDERS[code];

    if (!provider) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Bu ülke config'te tanımlı değil. Admin'e bildir.",
        show_alert: true,
      });
      return;
    }

    // inline keyboard for provider buttons (URL'ler)
    const keyboard = provider.buttons.map((b) => [{ text: b.text, url: b.url }]);

    // Eğer message üzerinde eskiden bir menü varsa, edit ile güncelle (temiz görünür)
    try {
      await bot.editMessageText(`Seçilen: ${provider.name}\nİlgili vize merkezleri:`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (e) {
      // edit başarısızsa, yeni mesaj at
      await bot.sendMessage(chatId, `Seçilen: ${provider.name}\nİlgili vize merkezleri:`, {
        reply_markup: { inline_keyboard: keyboard },
      });
    }

    // callback'i sonlandır
    await bot.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // diğer callback tipleri varsa handle et
  await bot.answerCallbackQuery(callbackQuery.id);
});

// polling hatalarını logla
bot.on("polling_error", (err) => {
  console.error("Polling hatası:", err);
});

// düzgün kapanış (Railway / Heroku gibi platformlarda)
process.once("SIGINT", () => {
  console.log("SIGINT alındı; bot durduruluyor...");
  bot.stopPolling();
});
process.once("SIGTERM", () => {
  console.log("SIGTERM alındı; bot durduruluyor...");
  bot.stopPolling();
});

console.log("Telegram bot hazır. Komut: /start veya /countries");
