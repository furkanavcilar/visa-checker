// src/providers.ts
export interface ProviderUrls {
  name: string;        // gösterilecek ülke ismi
  code: string;        // kısa kod (örn: nld, deu)
  buttons: {           // inline keyboard için bir veya birden fazla url butonu
    text: string;
    url: string;
  }[];
}

export const PROVIDERS: Record<string, ProviderUrls> = {
  // örnek: Hollanda
  nld: {
    name: "Hollanda",
    code: "nld",
    buttons: [
      { text: "VFS (Hollanda)", url: "https://visa.vfsglobal.com/nld/your-path-here" },
      { text: "BLS (Hollanda)", url: "https://blsnld.com/book-appointment" },
    ],
  },

  deu: {
    name: "Almanya",
    code: "deu",
    buttons: [
      { text: "TLS / Almanya", url: "https://deu.tlscontact.com/tr/your-path-here" },
      { text: "VFS (Almanya)", url: "https://visa.vfsglobal.com/deu/your-path-here" },
    ],
  },

  fra: {
    name: "Fransa",
    code: "fra",
    buttons: [
      { text: "TLS / Fransa", url: "https://fra.tlscontact.com/tr/your-path-here" },
      { text: "VFS (Fransa)", url: "https://visa.vfsglobal.com/fra/your-path-here" },
    ],
  },

  ita: {
    name: "İtalya",
    code: "ita",
    buttons: [
      { text: "TLS / İtalya", url: "https://ita.tlscontact.com/tr/your-path-here" },
      { text: "BLS (İtalya)", url: "https://blsita.com/book-appointment" },
    ],
  },

  esp: {
    name: "İspanya",
    code: "esp",
    buttons: [
      { text: "BLS (İspanya)", url: "https://blsesp.com/book-appointment" },
      { text: "VFS (İspanya)", url: "https://visa.vfsglobal.com/esp/your-path-here" },
    ],
  },

  swe: {
    name: "İsveç",
    code: "swe",
    buttons: [
      { text: "TLS / İsveç", url: "https://swe.tlscontact.com/tr/your-path-here" },
      { text: "BLS (İsveç)", url: "https://blsswe.com/book-appointment" },
    ],
  },

  nor: {
    name: "Norveç",
    code: "nor",
    buttons: [
      { text: "BLS (Norveç)", url: "https://blsnor.com/book-appointment" },
      { text: "VFS (Norveç)", url: "https://visa.vfsglobal.com/nor/your-path-here" },
    ],
  },

  // buraya istediğin kadar ülke ekle; anahtar: kısa kod (nld,deu,fra,...)
};
