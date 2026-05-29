const { Telegraf } = require('telegraf');
const config = require('./config/config');
const connectDB = require('./config/db');
const checkSubscription = require('./middlewares/checkSubscription');
const {
  handleStart,
  handleCheckSubscription,
  handleLessons,
  handleProfile,
  handleSinovTesti,
  handleVideoDarslik,
  handleLugat,
  handleLugatMain,
  handleBook1,
  handleBook2,
  handlePollAnswer,
  handleAloqa,
} = require('./controllers/botController');

/**
 * Loyihaning asosiy ishga tushish nuqtasi
 */
const startApp = async () => {
  try {
    // 1. Ma'lumotlar bazasiga ulanish
    await connectDB();

    // 2. Telegram Botni yaratish
    const bot = new Telegraf(config.botToken);

    // 3. Majburiy obuna middleware'ini ulash
    // Ushbu middleware botga kelgan har qanday matnli xabarni tekshiradi
    bot.use(checkSubscription);

    // 4. Bot buyruqlarini va hodisalarini sozlash
    
    // /start buyrug'i
    bot.start(handleStart);

    // Callback query "check_subscription" (Inline tugma)
    bot.action('check_subscription', handleCheckSubscription);

    // Lug'at kitoblarining callback harakatlari
    bot.action('book_1', handleBook1);
    bot.action('book_2', handleBook2);
    bot.action('lugat_main', handleLugatMain);

    // Poll/quiz javoblarini tinglash
    bot.on('poll_answer', handlePollAnswer);

    // Yangi reply menu tugmalari
    bot.hears('SINOV TESTI', handleSinovTesti);
    bot.hears('VIDEO DARSLIK', handleVideoDarslik);
    // Lug'at so'zining har xil turdagi apostroflari bilan kelish ehtimolini hisobga olamiz
    bot.hears(['LUG\'AT', 'LUG‘AT', 'LUG’AT', 'Lug\'at'], handleLugat);
    bot.hears('📞 Aloqa', handleAloqa);

    // Eski reply menu tugmalari (foydalanuvchilarda eski tugmalar keshlanib qolgan bo'lsa xatolik bo'lmasligi uchun)
    bot.hears('📚 Darslar', handleLessons);
    bot.hears('👤 Profil', handleProfile);

    // 5. Botni ishga tushirish (Polling)
    await bot.launch();
    console.log('Telegram bot muvaffaqiyatli ishga tushdi...');

    // 6. Graceful Shutdown (Tizim kutilmaganda to'xtaganda botni xavfsiz yopish)
    process.once('SIGINT', () => {
      console.log('SIGINT signali qabul qilindi. Bot to\'xtatilmoqda...');
      bot.stop('SIGINT');
    });
    
    process.once('SIGTERM', () => {
      console.log('SIGTERM signali qabul qilindi. Bot to\'xtatilmoqda...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    console.error(`Loyiha ishga tushishida xatolik: ${error.message}`);
    process.exit(1);
  }
};

// Ilovani ishga tushirish
startApp();

// Render.com bepul tarifi uchun HTTP server portini ochish
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('English Pro Telegram Bot muvaffaqiyatli ishlamoqda!');
}).listen(PORT, () => {
  console.log(`Render.com uchun HTTP server ${PORT}-portda ishga tushdi.`);
});
