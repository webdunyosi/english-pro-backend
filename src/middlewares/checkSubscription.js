const User = require('../models/User');
const config = require('../config/config');

/**
 * Majburiy obunani tekshiruvchi middleware
 * Foydalanuvchini bazaga qo'shadi va kanalga a'zoligini tekshiradi.
 */
const checkSubscription = async (ctx, next) => {
  try {
    // Agar foydalanuvchi ma'lumoti bo'lmasa, keyingi bosqichga o'tish (masalan, tizim xabarlari bo'lsa)
    if (!ctx.from) {
      return next();
    }

    // Callback so'rovlariga middleware ta'sir qilmasligi kerak (ular controller ichida alohida tekshiriladi)
    if (ctx.callbackQuery) {
      return next();
    }

    const userId = ctx.from.id;
    const username = ctx.from.username || null;
    const firstName = ctx.from.first_name || 'Foydalanuvchi';

    // 1. Foydalanuvchini ma'lumotlar bazasida bor-yo'qligini tekshirish va ro'yxatga olish
    let user = await User.findOne({ telegramId: userId.toString() });
    
    if (!user) {
      user = new User({
        telegramId: userId.toString(),
        username,
        firstName,
      });
      await user.save();
      console.log(`Yangi foydalanuvchi ro'yxatdan o'tdi: ${firstName} (ID: ${userId})`);
    }

    // Admin obunani tekshirishdan ozod qilinishi mumkin (ixtiyoriy)
    if (config.adminId && userId === config.adminId) {
      return next();
    }

    // 2. Kanalga obunani tekshirish
    let isSubscribed = false;
    try {
      const member = await ctx.telegram.getChatMember(config.channelId, userId);
      
      // Foydalanuvchining kanaldagi roli/statusini tekshirish
      const activeStatuses = ['creator', 'administrator', 'member'];
      if (activeStatuses.includes(member.status)) {
        isSubscribed = true;
      }
    } catch (err) {
      // Agar bot kanalda admin bo'lmasa yoki kanal topilmasa xatolik beradi
      console.error(`Kanal a'zoligini tekshirishda xatolik yuz berdi (Bot kanalda admin ekanligini tekshiring): ${err.message}`);
      isSubscribed = false;
    }

    // 3. Agar obuna bo'lmasa, kirishni cheklash va inline tugmalarni ko'rsatish
    if (!isSubscribed) {
      return ctx.reply(
        `Hurmatli ${firstName}!\n\nBotdan to'liq foydalanish uchun homiy kanalimizga a'zo bo'lishingiz majburiy hisoblanadi. Iltimos, kanalga obuna bo'ling va so'ngra pastdagi tugmani bosing. 👇`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📢 Kanalga o\'tish',
                  url: config.channelUrl,
                },
              ],
              [
                {
                  text: '✅ A\'zo bo\'ldim',
                  callback_data: 'check_subscription',
                },
              ],
            ],
          },
        }
      );
    }

    // Foydalanuvchi obuna bo'lgan bo'lsa, keyingi controller/handlerga ruxsat berish
    return next();
  } catch (error) {
    console.error(`checkSubscription middleware xatoligi: ${error.message}`);
    // Foydalanuvchiga xatolik haqida muloyim xabar ko'rsatish
    return ctx.reply('Kechirasiz, tizimda texnik xatolik yuz berdi. Iltimos, birozdan so\'ng qayta urinib ko\'ring.');
  }
};

module.exports = checkSubscription;
