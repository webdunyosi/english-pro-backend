const mongoose = require('mongoose');
const config = require('./config');

/**
 * MongoDB ma'lumotlar bazasiga ulanish funksiyasi
 */
const connectDB = async () => {
  try {
    // Mongoose orqali bazaga ulanish
    const conn = await mongoose.connect(config.mongoUri);

    console.log(`MongoDB muvaffaqiyatli ulandi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB ulanishida xatolik yuz berdi: ${error.message}`);
    // Ulanish bajarilmasa loyihani to'xtatish
    process.exit(1);
  }
};

module.exports = connectDB;
