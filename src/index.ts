import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

// Telegram Bot başlat
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, {
  polling: true,
});

// Railway restartlarında düzgün kapanması için
process.once("SIGINT", () => bot.stopPolling());
process.once("SIGTERM", () => bot.stopPolling());

bot.on("polling_error", (err) => {
  console.error("Polling hatası:", err.message);
});

import cron from 'node-cron';
import { config } from './config/environment';
import { cacheService } from './services/cache';
import { checkAppointments } from './utils/appointmentChecker';

// Önbellek temizleme işlemini başlat
cacheService.startCleanupInterval();

// Zamanlanmış görevi başlat
cron.schedule(config.app.checkInterval, checkAppointments);
console.log(`Vize randevu kontrolü başlatıldı. Kontrol sıklığı: ${config.app.checkInterval}`);
console.log(`Hedef ülke: ${config.app.targetCountry}`);
console.log(`Hedef ülkeler: ${config.app.missionCountries.join(', ')}`);
if (config.app.targetCities.length > 0) {
  console.log(`Hedef şehirler: ${config.app.targetCities.join(', ')}`);
}

// İlk kontrolü yap
void checkAppointments();
