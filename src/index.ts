import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import { config } from "./config/environment";
import { cacheService } from "./services/cache";
import { checkAppointments } from "./utils/appointmentChecker";

dotenv.config();

// --- TELEGRAM BOT BAŞLAT --- //
async function startBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN tanımlı değil (.env hatası)");

    const bot = new TelegramBot(token, { polling: true });

    try {
      // Webhook varsa kaldır (400 dönerse hata değil)
      await bot.deleteWebHook({ drop_pending_updates: true });
      console.log("Webhook silindi (polling modu aktif).");
    } catch (e: any) {
      console.warn("Webhook silinemedi:", e.message);
    }

    console.log("✅ Telegram bot başlatıldı (tek instance).");

    bot.on("polling_error", (err) => {
      console.error("Polling hatası:", err.message);
    });

    // Railway konteyner yeniden başlarken düzgün kapatma
    process.once("SIGINT", () => bot.stopPolling());
    process.once("SIGTERM", () => bot.stopPolling());

  } catch (err: any) {
    console.error("❌ Telegram bot başlatılamadı:", err.message);
  }
}

startBot();

// --- CACHE VE CRON GÖREVLERİ --- //
cacheService.startCleanupInterval();
cron.schedule(config.app.checkInterval, checkAppointments);

console.log(`Vize randevu kontrolü başlatıldı. Kontrol sıklığı: ${config.app.checkInterval}`);
console.log(`Hedef ülke: ${config.app.targetCountry}`);
console.log(`Hedef ülkeler: ${config.app.missionCountries.join(", ")}`);

if (config.app.targetCities.length > 0) {
  console.log(`Hedef şehirler: ${config.app.targetCities.join(", ")}`);
}

// İlk kontrolü yap
void checkAppointments();
