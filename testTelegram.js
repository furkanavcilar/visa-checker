const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot('8013255951:AAEZ6p8C9qPVUl1-9MN-nWMK6tjD_uscTlI', { polling: false });

bot.sendMessage('840313159', 'Test mesajı geldi mi?')
  .then(() => console.log('Mesaj gönderildi!'))
  .catch(err => console.error('Mesaj gönderilemedi:', err));
