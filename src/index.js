const { Telegraf } = require('telegraf');
const config = require('./config/config');
const connectDB = require('./config/db');
const checkSubscription = require('./middlewares/checkSubscription');
const {
  handleStart,
  handleCheckSubscription,
  handleLessons,
  handleProfile,
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

    // Reply menu tugmalari
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
