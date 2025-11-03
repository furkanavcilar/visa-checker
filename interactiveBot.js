import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { queryAllProviders } from "./providers/registry.js";

// Ortam değişkenleri
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const URL = process.env.RAILWAY_STATIC_URL || "https://visa-checker.up.railway.app";
const PORT = process.env.PORT || 3000;

// Bot oluşturuluyor (webhook modu)
const bot = new TelegramBot(TOKEN);
await bot.setWebHook(`${URL}/bot${TOKEN}`);

console.log("✅ Telegram bot başlatıldı (webhook modu).");

// Express uygulaması başlat
const app = express();
app.use(express.json());

// Telegram’dan gelen güncellemeleri dinle
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Web sunucusunu başlat
app.listen(PORT, () => {
  console.log(`🌐 Webhook listener aktif - Port: ${PORT}`);
});

// /start komutu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcome = `
🌍 *Visa Checker Bot'a Hoşgeldiniz!*
Lütfen kontrol etmek istediğiniz ülke grubunu seçin:
- 🇫🇷 Fransa
- 🇩🇪 Almanya
- 🇳🇱 Hollanda
- 🇹🇷 Türkiye
- 🇪🇸 İspanya

Komut:
\`/check <ülke_kodu>\`
örnek: /check fr
  `;
  bot.sendMessage(chatId, welcome, { parse_mode: "Markdown" });
});

// /check komutu (ülke kontrolü)
bot.onText(/\/check (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const country = match[1].trim().toLowerCase();

  try {
    bot.sendMessage(chatId, "🔍 Randevu durumu sorgulanıyor, lütfen bekleyin...");

    const results = await queryAllProviders({ missionCodes: [country] });
    if (!results || results.length === 0) {
      bot.sendMessage(chatId, `❌ ${country.toUpperCase()} için uygun randevu bulunamadı.`);
      return;
    }

    let message = `✅ *${country.toUpperCase()} için uygun randevular bulundu:*\n\n`;
    for (const r of results) {
      message += `📍 *${r.provider}* - ${r.location}\nDurum: ${r.status}\n\n`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Sorgu hatası:", err);
    bot.sendMessage(chatId, "⚠️ Sorgu sırasında bir hata oluştu, lütfen tekrar deneyin.");
  }
});

// Hataları logla (gizli şekilde)
bot.on("polling_error", (err) => {
  console.error("Polling hatası:", err.message);
});

bot.on("webhook_error", (err) => {
  console.error("Webhook hatası:", err.message);
});
