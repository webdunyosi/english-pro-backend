const User = require('../models/User');
const config = require('../config/config');

/**
 * Asosiy ReplyKeyboardMarkup (Menyu) tugmalari
 */
const getMainMenu = () => {
  return {
    reply_markup: {
      keyboard: [
        [{ text: 'SINOV TESTI' }, { text: 'VIDEO DARSLIK' }],
        [{ text: "LUG'AT" }]
      ],
      resize_keyboard: true, // Tugmalarni mos o'lchamga keltirish
      one_time_keyboard: false, // Doimiy ko'rinib turishi
    }
  };
};

/**
 * /start buyrug'ini qayta ishlash
 */
const handleStart = async (ctx) => {
  try {
    const firstName = ctx.from.first_name || 'Foydalanuvchi';
    
    // Foydalanuvchi allaqachon obuna bo'lgan bo'ladi (middleware'dan o'tgan)
    return ctx.reply(
      `Xush kelibsiz, ${firstName}! \n\nSiz barcha majburiy obuna shartlarini bajardingiz va botimizdan to'liq foydalanishingiz mumkin. Quyidagi menyudan o'zingizga kerakli bo'limni tanlang.`,
      getMainMenu()
    );
  } catch (error) {
    console.error(`handleStart xatoligi: ${error.message}`);
    return ctx.reply('Kechirasiz, start buyrug\'ini bajarishda xatolik yuz berdi.');
  }
};

/**
 * "✅ A'zo bo'ldim" inline tugmasi bosilganda callback query'ni qayta ishlash
 */
const handleCheckSubscription = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'Foydalanuvchi';

    // 1. Kanalga obunani tekshirish
    let isSubscribed = false;
    try {
      const member = await ctx.telegram.getChatMember(config.channelId, userId);
      const activeStatuses = ['creator', 'administrator', 'member'];
      if (activeStatuses.includes(member.status)) {
        isSubscribed = true;
      }
    } catch (err) {
      console.error(`Callback tekshiruvida kanal xatoligi: ${err.message}`);
      isSubscribed = false;
    }

    // 2. Agar obuna bo'lgan bo'lsa
    if (isSubscribed) {
      // Callback'ga yashil bildirishnoma ko'rsatish
      await ctx.answerCbQuery('Rahmat! Obuna tasdiqlandi. 🎉');

      // Oldingi inline tugmali xabarni o'chirish
      try {
        await ctx.deleteMessage();
      } catch (err) {
        console.error(`Eski xabarni o'chirishda xatolik: ${err.message}`);
      }

      // Foydalanuvchini muvaffaqiyatli kutib olish va asosiy menyuni chiqarish
      return ctx.reply(
        `Tabriklaymiz, ${firstName}! Kanalimizga obuna muvaffaqiyatli tasdiqlandi. \n\nEndi botimiz xizmatlaridan to'liq foydalanishingiz mumkin!`,
        getMainMenu()
      );
    } else {
      // 3. Agar hali ham a'zo bo'lmagan bo'lsa
      // Callback'ga kichik ogohlantirish (popup) chiqarish
      await ctx.answerCbQuery("Siz hali kanalga a'zo bo'lmadingiz! ❌", { show_alert: true });

      // Dinamik matn yaratish (Telegram 'message is not modified' xatoligini oldini olish uchun joriy vaqt qo'shiladi)
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const alertText = `Siz hali kanalga a'zo bo'lmadingiz! Iltimos, kanalga a'zo bo'lib qayta urinib ko'ring.\n\n[Oxirgi tekshiruv vaqti: ${timeString}]`;

      // Inline tugmalarni saqlab qolgan holda xabarni tahrirlash
      return ctx.editMessageText(
        alertText,
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
      ).catch((err) => {
        // Matn o'zgarmagan bo'lsa xatolik konsolga yoziladi, lekin bot ishdan to'xtamaydi
        console.warn(`editMessageText xatoligi (balki matn o'zgarmagan): ${err.message}`);
      });
    }
  } catch (error) {
    console.error(`handleCheckSubscription xatoligi: ${error.message}`);
    return ctx.answerCbQuery('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.', { show_alert: true });
  }
};

/**
 * "📚 Darslar" reply tugmasini qayta ishlash
 */
const handleLessons = async (ctx) => {
  try {
    return ctx.reply(
      '📚 **Darslar bo\'limiga xush kelibsiz!**\n\nBu yerda siz uchun maxsus tayyorlangan ingliz tili darslari joylashtiriladi. Tez kunda yangi darslar yuklanadi. Bizni kuzatishda davom eting!',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(`handleLessons xatoligi: ${error.message}`);
    return ctx.reply('Darslarni yuklashda xatolik yuz berdi.');
  }
};

/**
 * "👤 Profil" reply tugmasini qayta ishlash
 */
const handleProfile = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Foydalanuvchini bazadan qidirish
    const user = await User.findOne({ telegramId: userId.toString() });

    if (!user) {
      return ctx.reply('Kechirasiz, profilingiz haqida ma\'lumot topilmadi. Qayta /start buyrug\'ini yuboring.');
    }

    // Chiroyli sana formati
    const joinDate = new Date(user.joinedAt);
    const formattedDate = joinDate.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const profileText = `👤 **Sizning Profilingiz:**\n\n` +
      `▪️ **Ism:** ${user.firstName}\n` +
      `▪️ **Username:** ${user.username ? '@' + user.username : 'Mavjud emas'}\n` +
      `▪️ **Telegram ID:** \`${user.telegramId}\`\n` +
      `▪️ **Ro'yxatdan o'tgan sana:** ${formattedDate}`;

    return ctx.reply(profileText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`handleProfile xatoligi: ${error.message}`);
    return ctx.reply('Profil ma\'lumotlarini yuklashda xatolik yuz berdi.');
  }
};

/**
 * "SINOV TESTI" reply tugmasini qayta ishlash
 */
const handleSinovTesti = async (ctx) => {
  try {
    return ctx.reply(
      '📝 **SINOV TESTI**\n\nIngliz tili bilim darajangizni aniqlash va o\'rganilgan mavzularni mustahkamlash uchun mo\'ljallangan testlar bo\'limi.\n\n⚡️ *Tez kunda bu yerda turli darajadagi qiziqarli testlar va imtihonlar paydo bo\'ladi!*',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(`handleSinovTesti xatoligi: ${error.message}`);
    return ctx.reply('Sinov testlarini yuklashda xatolik yuz berdi.');
  }
};

/**
 * "VIDEO DARSLIK" reply tugmasini qayta ishlash
 */
const handleVideoDarslik = async (ctx) => {
  try {
    return ctx.reply(
      '📺 **VIDEO DARSLIK**\n\nIngliz tili darslarini oson va qiziqarli o\'rganishingiz uchun maxsus video darsliklar va ko\'rsatmalar to\'plami.\n\n⚡️ *Tez kunda bu yerda yangi video darslar yuklanadi. Bizni kuzatishda davom eting!*',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(`handleVideoDarslik xatoligi: ${error.message}`);
    return ctx.reply('Video darsliklarni yuklashda xatolik yuz berdi.');
  }
};

/**
 * "LUG'AT" reply tugmasini qayta ishlash
 */
const handleLugat = async (ctx) => {
  try {
    const text =
      `📘 **4000 Essential English Words**\n\n` +
      `🖋 20 savollar\n` +
      `💬 Quiz mode\n` +
      `🔄 Word EN — Word UZ\n` +
      `⏱ Har bir savolga 30 sec\n\n` +
      `⌛️ **Unit'larni tanlash orqali savollar ro'yxatini shakllantiring!**`;

    return ctx.reply(
      text,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Unit 1', url: 'https://t.me/SmartTesterBot?start=29B5mvPo' },
              { text: 'Unit 2', url: 'https://t.me/SmartTesterBot?start=29mYNrtQ' },
              { text: 'Unit 3', url: 'https://t.me/SmartTesterBot?start=2x26JGuo' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error(`handleLugat xatoligi: ${error.message}`);
    return ctx.reply('Lug\'at bo\'limini yuklashda xatolik yuz berdi.');
  }
};

module.exports = {
  handleStart,
  handleCheckSubscription,
  handleLessons,
  handleProfile,
  handleSinovTesti,
  handleVideoDarslik,
  handleLugat,
};
