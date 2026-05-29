// dotenv kutubxonasini yuklash
require('dotenv').config();

/**
 * Loyiha sozlamalari va muhit o'zgaruvchilarini boshqarish
 * Barcha o'zgaruvchilar bu yerda tekshiriladi va xavfsiz holatda eksport qilinadi.
 */
const config = {
  botToken: process.env.BOT_TOKEN,
  adminId: process.env.ADMIN_ID ? parseInt(process.env.ADMIN_ID, 10) : null,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/english_pro_bot',
  channelId: process.env.CHANNEL_ID,
  channelUrl: process.env.CHANNEL_URL || 'https://t.me/your_channel',
};

// Muhim sozlamalar mavjudligini tekshirish
if (!config.botToken) {
  console.error("XATOLIK: BOT_TOKEN muhit o'zgaruvchisi (.env) aniqlanmadi!");
  process.exit(1);
}

if (!config.channelId) {
  console.error("XATOLIK: CHANNEL_ID muhit o'zgaruvchisi (.env) aniqlanmadi!");
  process.exit(1);
}

module.exports = config;
