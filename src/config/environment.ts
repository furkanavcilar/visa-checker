import dotenv from "dotenv";

dotenv.config();

/**
 * Ortam değişkenleri için tip tanımı
 */
export interface EnvironmentConfig {
  telegram: {
    botToken: string;
    channelId: string;
    rateLimit: number;
    retryAfter: number;
  };
  app: {
    checkInterval: string;
    targetCountry: string;
    targetCities: string[];
    missionCountries: string[];
    targetSubCategories: string[];
    debug: boolean;
  };
  api: {
    visaApiUrl: string;
    maxRetries: number;
    retryDelayBase: number;
  };
  cache: {
    maxSize: number;
    cleanupInterval: number;
  };
}

/**
 * Ortam değişkenlerini doğrula ve config nesnesi oluştur
 */
function validateEnvironment(): EnvironmentConfig {
  // Gerekli değişkenleri kontrol et
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN tanımlı değil!");
    process.exit(1);
  }

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error("❌ TELEGRAM_CHAT_ID tanımlı değil!");
    process.exit(1);
  }

  // Şehirler
  const cities = process.env.CITIES
    ? process.env.CITIES.split(",").map((c) => c.trim())
    : ["Ankara"];

  // Hedef ülkeler
  const missionCountries = process.env.MISSION_COUNTRY
    ? process.env.MISSION_COUNTRY.split(",").map((c) => c.trim().toLowerCase())
    : ["deu", "ita", "nld", "esp", "fra", "swe", "nor"];

  // Alt kategoriler
  const subCategories = process.env.VISA_SUBCATEGORIES
    ? process.env.VISA_SUBCATEGORIES.split(",").map((s) => s.trim())
    : [];

  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      channelId: process.env.TELEGRAM_CHAT_ID,
      rateLimit: Number(process.env.TELEGRAM_RATE_LIMIT_MINUTES) || 15,
      retryAfter: Number(process.env.TELEGRAM_RETRY_AFTER) || 5000,
    },
    app: {
      checkInterval: process.env.CHECK_INTERVAL || "*/10 * * * *", // 10 dakikada bir
      targetCountry:
        process.env.TARGET_COUNTRY?.toLowerCase() || "tur", // Türkiye
      targetCities: cities,
      missionCountries,
      targetSubCategories: subCategories,
      debug: process.env.DEBUG === "true",
    },
    api: {
      visaApiUrl:
        process.env.VISA_API_URL ||
        "https://api.visasbot.com/api/visa/list", // fallback URL
      maxRetries: Number(process.env.MAX_RETRIES) || 3,
      retryDelayBase: Number(process.env.RETRY_DELAY_BASE) || 1000,
    },
    cache: {
      maxSize: Number(process.env.MAX_CACHE_SIZE) || 1000,
      cleanupInterval:
        Number(process.env.CACHE_CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000, // 1 gün
    },
  };
}

export const config = validateEnvironment();
