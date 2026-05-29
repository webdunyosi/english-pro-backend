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
    const text =
      `📊 **Ingliz tilini aniqlash testi**\n\n` +
      `**1. (A1) Oson daraja**\n` +
      `She _____ from Japan. She is from South Korea.\n` +
      `A) are\n` +
      `B) is not\n` +
      `C) am not\n` +
      `D) be not\n\n` +
      `**2. (A2) Boshlang'ich-o'rta daraja**\n` +
      `I _____ to the cinema yesterday because I was very tired.\n` +
      `A) don't go\n` +
      `B) didn't go\n` +
      `C) didn't went\n` +
      `D) wasn't go\n\n` +
      `**3. (B1) O'rta daraja**\n` +
      `If it rains tomorrow, we _____ at home and watch a movie.\n` +
      `A) will stay\n` +
      `B) stay\n` +
      `C) stayed\n` +
      `D) would stay\n\n` +
      `**4. (B1) O'rta daraja**\n` +
      `Have you finished fixing that bug in the code _____?\n` +
      `A) already\n` +
      `B) just\n` +
      `C) yet\n` +
      `D) still\n\n` +
      `**5. (B2) O'rta-yuqori daraja**\n` +
      `The new software update _____ by the development team last night.\n` +
      `A) released\n` +
      `B) was released\n` +
      `C) has released\n` +
      `D) had released\n\n` +
      `**6. (B2) O'rta-yuqori daraja**\n` +
      `He _____ have left his laptop at the office; his bag is completely empty.\n` +
      `A) must\n` +
      `B) can't\n` +
      `C) shouldn't\n` +
      `D) wouldn't\n\n` +
      `**7. (C1) Yuqori daraja (Inversion)**\n` +
      `Not only _____ the final exam, but she also got the highest score in the entire university.\n` +
      `A) she passed\n` +
      `B) did she pass\n` +
      `C) she did pass\n` +
      `D) passed she\n\n` +
      `**8. (C1) Yuqori daraja (Subjunctive/Conditionals)**\n` +
      `I would rather you _____ that confidential information to anyone outside the company.\n` +
      `A) don't tell\n` +
      `B) didn't tell\n` +
      `C) not tell\n` +
      `D) won't tell\n\n` +
      `**9. (C1/C2) Mukammal daraja (Vocabulary)**\n` +
      `The manager was entirely _____ to the needs of her staff, which eventually caused high turnover.\n` +
      `A) indifferent\n` +
      `B) enthusiastic\n` +
      `C) susceptible\n` +
      `D) compliant\n\n` +
      `**10. (C1/C2) Mukammal daraja (Future Perfect)**\n` +
      `By the time you finish reading this documentation, I _____ the entire project to the server.\n` +
      `A) will deploy\n` +
      `B) will have deployed\n` +
      `C) am deploying\n` +
      `D) have deployed\n\n` +
      `----------------------------------------\n\n` +
      `✅ **To'g'ri javoblar kaliti:**\n\n` +
      `*O'zingizni tekshirib ko'rishingiz uchun:*\n\n` +
      `1. **B** (A1 - *To be* fe'lining inkor shakli)\n` +
      `2. **B** (A2 - *Past Simple* inkor shakli)\n` +
      `3. **A** (B1 - *First Conditional* qoidasi)\n` +
      `4. **C** (B1 - *Present Perfect* dagi *yet* so'zining so'roq gapda ishlatilishi)\n` +
      `5. **B** (B2 - *Passive Voice* va *Past Simple*)\n` +
      `6. **A** (B2 - *Modals of Deduction* - kuchli ishonch)\n` +
      `7. **B** (C1 - *Inversion* qoidasi, urg'u berish uchun yordamchi fe'l oldinga chiqadi)\n` +
      `8. **B** (C1 - *Would rather + past simple* qoidasi - hozirgi zamondagi xohish)\n` +
      `9. **A** (C1/C2 - *Indifferent* - beparvo, e'tiborsiz degan ma'noni beradi)\n` +
      `10. **B** (C1/C2 - *Future Perfect* qoidasi - kelajakdagi ma'lum bir nuqtagacha tugallanadigan ish)`;

    return ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`handleSinovTesti xatoligi: ${error.message}`);
    return ctx.reply('Sinov testini yuklashda xatolik yuz berdi.');
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
    return ctx.reply(
      `📚 **Lug'at Bo'limi**\n\nQuyidagi kitoblardan birini tanlang:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📘 KITOB 1', callback_data: 'book_1' },
              { text: '📘 KITOB 2', callback_data: 'book_2' }
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

/**
 * LUG'AT asosiy oynasiga qaytish (ortga tugmasi uchun)
 */
const handleLugatMain = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `📚 **Lug'at Bo'limi**\n\nQuyidagi kitoblardan birini tanlang:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📘 KITOB 1', callback_data: 'book_1' },
              { text: '📘 KITOB 2', callback_data: 'book_2' }
            ]
          ]
        }
      }
    ).catch((err) => {
      console.warn(`handleLugatMain editMessageText xatoligi: ${err.message}`);
    });
  } catch (error) {
    console.error(`handleLugatMain xatoligi: ${error.message}`);
  }
};

/**
 * KITOB 1 bo'limini ko'rsatish
 */
const handleBook1 = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const text =
      `📘 **4000 Essential English Words - KITOB 1**\n\n` +
      `🖋 20 savollar\n` +
      `💬 Quiz mode\n` +
      `🔄 Word EN — Word UZ\n` +
      `⏱ Har bir savolga 30 sec\n\n` +
      `⌛️ **Unit'larni tanlash orqali savollar ro'yxatini shakllantiring!**`;

    return ctx.editMessageText(
      text,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Unit 1', url: 'https://t.me/SmartTesterBot?start=29B5mvPo' },
              { text: 'Unit 2', url: 'https://t.me/SmartTesterBot?start=29mYNrtQ' },
              { text: 'Unit 3', url: 'https://t.me/SmartTesterBot?start=2x26JGuo' }
            ],
            [
              { text: 'Unit 4', url: 'https://t.me/SmartTesterBot?start=2DD2iged' },
              { text: 'Unit 5', url: 'https://t.me/SmartTesterBot?start=2QS4J6pX' },
              { text: 'Unit 6', url: 'https://t.me/SmartTesterBot?start=2AEk9rNv' }
            ],
            [
              { text: 'Unit 7', url: 'https://t.me/SmartTesterBot?start=2bnwcJE8' },
              { text: 'Unit 8', url: 'https://t.me/SmartTesterBot?start=23wTyGAL' },
              { text: 'Unit 9', url: 'https://t.me/SmartTesterBot?start=3iZVWfyX' }
            ],
            [
              { text: 'Unit 10', url: 'https://t.me/SmartTesterBot?start=85HaEa8t' },
              { text: 'Unit 11', url: 'https://t.me/SmartTesterBot?start=5ce8JvKj' },
              { text: 'Unit 12', url: 'https://t.me/SmartTesterBot?start=2dTEZ2KA' }
            ],
            [
              { text: 'Unit 13', url: 'https://t.me/SmartTesterBot?start=5HHJZpPw' },
              { text: 'Unit 14', url: 'https://t.me/SmartTesterBot?start=2JWYdpP7' },
              { text: 'Unit 15', url: 'https://t.me/SmartTesterBot?start=3DjhouT4' }
            ],
            [
              { text: 'Unit 16', url: 'https://t.me/SmartTesterBot?start=2Ld2dpUF' },
              { text: 'Unit 17', url: 'https://t.me/SmartTesterBot?start=2JNfDxFW' },
              { text: 'Unit 18', url: 'https://t.me/SmartTesterBot?start=2rtQWoxA' }
            ],
            [
              { text: 'Unit 19', url: 'https://t.me/SmartTesterBot?start=3V3Fn9f7' },
              { text: 'Unit 20', url: 'https://t.me/SmartTesterBot?start=2YbWP3Xp' },
              { text: 'Unit 21', url: 'https://t.me/SmartTesterBot?start=6Bq5SrfC' }
            ],
            [
              { text: 'Unit 22', url: 'https://t.me/SmartTesterBot?start=45Q4kBro' },
              { text: 'Unit 23', url: 'https://t.me/SmartTesterBot?start=2UsNzjzF' },
              { text: 'Unit 24', url: 'https://t.me/SmartTesterBot?start=24arMobX' }
            ],
            [
              { text: 'Unit 25', url: 'https://t.me/SmartTesterBot?start=2Y7qkuJS' },
              { text: 'Unit 26', url: 'https://t.me/SmartTesterBot?start=4aNnuu65' },
              { text: 'Unit 27', url: 'https://t.me/SmartTesterBot?start=3HNtroQo' }
            ],
            [
              { text: 'Unit 28', url: 'https://t.me/SmartTesterBot?start=3X5uV3nm' },
              { text: 'Unit 29', url: 'https://t.me/SmartTesterBot?start=24XLrS9q' },
              { text: 'Unit 30', url: 'https://t.me/SmartTesterBot?start=2GkBQDdq' }
            ],
            [
              { text: '◀️ Ortga', callback_data: 'lugat_main' }
            ]
          ]
        }
      }
    ).catch((err) => {
      console.warn(`handleBook1 editMessageText xatoligi: ${err.message}`);
    });
  } catch (error) {
    console.error(`handleBook1 xatoligi: ${error.message}`);
  }
};

/**
 * KITOB 2 bo'limini ko'rsatish
 */
const handleBook2 = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const text =
      `📘 **4000 Essential English Words - KITOB 2**\n\n` +
      `⚡️ *Ushbu kitob uchun darslar va testlar tez kunda yuklanadi. Bizni kuzatishda davom eting!*`;

    return ctx.editMessageText(
      text,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '◀️ Ortga', callback_data: 'lugat_main' }
            ]
          ]
        }
      }
    ).catch((err) => {
      console.warn(`handleBook2 editMessageText xatoligi: ${err.message}`);
    });
  } catch (error) {
    console.error(`handleBook2 xatoligi: ${error.message}`);
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
  handleLugatMain,
  handleBook1,
  handleBook2,
};
