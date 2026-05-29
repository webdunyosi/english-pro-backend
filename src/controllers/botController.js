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
    await ctx.reply(
      '📊 **Ingliz tilini aniqlash testi**\n\nQuyidagi testlarni yechish orqali ingliz tili bilim darajangizni tekshirib o\'ting! 👇',
      { parse_mode: 'Markdown' }
    );

    const placementQuizzes = [
      {
        question: '1. (A1) She _____ from Japan. She is from South Korea.',
        options: ['are', 'is not', 'am not', 'be not'],
        correctOptionId: 1,
        explanation: 'A1 - "To be" fe\'lining uchinchi shaxs birlik shakli "is", inkor shaklida "is not" bo\'ladi.'
      },
      {
        question: '2. (A2) I _____ to the cinema yesterday because I was very tired.',
        options: ["don't go", "didn't go", "didn't went", "wasn't go"],
        correctOptionId: 1,
        explanation: 'A2 - O\'tgan zamon (Past Simple) inkor gapida "didn\'t" yordamchi fe\'lidan keyin fe\'lning 1-shakli (go) keladi.'
      },
      {
        question: '3. (B1) If it rains tomorrow, we _____ at home and watch a movie.',
        options: ['will stay', 'stay', 'stayed', 'would stay'],
        correctOptionId: 0,
        explanation: 'B1 - Birinchi tur shart gapi (First Conditional): If + Present Simple, Future Simple (will stay).'
      },
      {
        question: '4. (B1) Have you finished fixing that bug in the code _____?',
        options: ['already', 'just', 'yet', 'still'],
        correctOptionId: 2,
        explanation: 'B1 - Hozirgi tugallangan zamon (Present Perfect) so\'roq gaplarida oxirida "yet" ishlatiladi.'
      },
      {
        question: '5. (B2) The new software update _____ by the development team last night.',
        options: ['released', 'was released', 'has released', 'had released'],
        correctOptionId: 1,
        explanation: 'B2 - Majhul nisbat (Passive Voice) va o\'tgan zamon (Past Simple): object + was/were + V3 (was released).'
      },
      {
        question: '6. (B2) He _____ have left his laptop at the office; his bag is completely empty.',
        options: ['must', "can't", 'shouldn't', "wouldn't"],
        correctOptionId: 0,
        explanation: 'B2 - Taxmin qilish (Modals of Deduction): biror narsaga qat\'iy ishonch bildirganimizda "must have done" ishlatiladi.'
      },
      {
        question: '7. (C1) Not only _____ the final exam, but she also got the highest score in the entire university.',
        options: ['she passed', 'did she pass', 'she did pass', 'passed she'],
        correctOptionId: 1,
        explanation: 'C1 - Inversion: Gap "Not only" bilan boshlanganda gap tarkibi so\'roq gap shaklida inversiya qilinadi (did she pass).'
      },
      {
        question: '8. (C1) I would rather you _____ that confidential information to anyone outside the company.',
        options: ["don't tell", "didn't tell", "not tell", "won't tell"],
        correctOptionId: 1,
        explanation: 'C1 - "Would rather + subject + Past Simple" tuzilishi hozirgi/kelasi zamondagi istak va xohishlarni bildiradi.'
      },
      {
        question: '9. (C1/C2) The manager was entirely _____ to the needs of her staff, which eventually caused high turnover.',
        options: ['indifferent', 'enthusiastic', 'susceptible', 'compliant'],
        correctOptionId: 0,
        explanation: 'C1/C2 - "Indifferent" so\'zi kimga/nimagadir e\'tiborsiz, beparvo bo\'lish degan ma\'noni anglatadi.'
      },
      {
        question: '10. (C1/C2) By the time you finish reading this documentation, I _____ the entire project to the server.',
        options: ['will deploy', 'will have deployed', 'am deploying', 'have deployed'],
        correctOptionId: 1,
        explanation: 'C1/C2 - "By the time + Present Simple, Future Perfect (will have deployed)" kelajakdagi tugallanadigan ishni bildiradi.'
      }
    ];

    // Har bir testni alohida Telegram Quiz (Poll) shaklida yuboramiz
    for (const quiz of placementQuizzes) {
      await ctx.replyWithPoll(
        quiz.question,
        quiz.options,
        {
          type: 'quiz',
          correct_option_id: quiz.correctOptionId,
          explanation: quiz.explanation,
          is_anonymous: true
        }
      );
      // Ketma-ketlik buzilmasligi va Telegram cheklovlariga tushmaslik uchun 500ms kechikish qo'shamiz
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error(`handleSinovTesti xatoligi: ${error.message}`);
    return ctx.reply('Sinov testini yuklashda xatolik yuz berdi. Iltimos, birozdan so\'ng qayta urinib ko\'ring.');
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
