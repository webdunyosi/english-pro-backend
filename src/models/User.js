const mongoose = require('mongoose');

/**
 * Telegram foydalanuvchisi modeli (User Schema)
 * Tizimga kirgan foydalanuvchilarning asosiy ma'lumotlarini saqlaydi.
 */
const UserSchema = new mongoose.Schema({
  // Foydalanuvchining Telegram ID si (unikal bo'lishi shart)
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Qidiruvni tezlashtirish uchun indeks qo'shildi
  },
  // Foydalanuvchining Telegram username'i (@username shaklida)
  username: {
    type: String,
    default: null,
  },
  // Foydalanuvchining Telegram ism-sharifi
  firstName: {
    type: String,
    required: true,
  },
  // Botga birinchi marta start bosgan (ro'yxatdan o'tgan) sana
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  // Foydalanuvchining joriy quiz testi qadami (0 - boshlamagan, 1-10 - joriy savol)
  quizStep: {
    type: Number,
    default: 0,
  },
});

// User modelini eksport qilish
module.exports = mongoose.model('User', UserSchema);
