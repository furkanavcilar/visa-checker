import axios from "axios";

/**
 * IDATA vize randevu kontrolü
 * @param {Object} options - Parametreler
 * @param {string} options.country - Ülke kodu (örnek: "deu")
 * @param {string} options.city - Şehir adı (örnek: "Ankara")
 * @returns {Promise<Array>} Sonuç listesi
 */
export async function checkAvailability({ country = "tur", city = "Ankara" }) {
  const url = `https://idata.com.tr/${country}/${city}/appointment`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
      timeout: 10000,
    });

    // Eğer siteye erişim varsa
    return [
      {
        provider: "idata",
        country,
        city,
        status: "success",
        date: "tarih yok (henüz analiz eklenmedi)",
      },
    ];
  } catch (err) {
    // Eğer 403 dönerse
    if (err.response && err.response.status === 403) {
      console.error(`[HTTP ERROR] ${url} → 403 Forbidden`);
      return [{ provider: "idata", country, city, status: "forbidden" }];
    }

    console.error(`[HTTP ERROR] ${url} → ${err.message}`);
    return [{ provider: "idata", country, city, status: "error" }];
  }
}
