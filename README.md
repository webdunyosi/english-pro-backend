# 📢 English Pro Telegram Bot - Toza Arxitektura va Majburiy Obuna Tizimi

Ushbu Telegram bot loyihasi xalqaro IT kompaniyalarining talablariga mos keladigan **Clean Code (Toza Kod)** va **MVC (Model-View-Controller)** arxitekturasi tamoyillari asosida yaratilgan. Loyihada foydalanuvchilarning homiy kanalga majburiy a'zo bo'lishini (mandatory subscription) tekshiruvchi universal va kengaytiriluvchan middleware joriy etilgan.

---

## 🛠 Texnologiyalar Steki (Tech Stack)

* **Node.js** — Dasturiy platforma.
* **Telegraf.js** — Telegram API bilan qulay ishlash uchun kutubxona.
* **Mongoose (MongoDB)** — Foydalanuvchilar ma'lumotlarini saqlash va boshqarish.
* **dotenv** — Maxfiy ma'lumotlar va kalitlarni `.env` fayli orqali xavfsiz yuklash.
* **Nodemon** (Faqat development) — Kod o'zgarganda botni avtomatik qayta yuklovchi vosita.

---

## 📂 Loyiha Strukturasi (Folder Structure)

Loyiha tartibsiz bo'lib ketmasligi va oson kengaytirilishi uchun quyidagi professional tuzilmaga ega:

```text
english-pro-backend/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB ulanishi (Mongoose)
│   │   └── config.js         # .env sozlamalarini xavfsiz tekshirib yuklash
│   ├── models/
│   │   └── User.js           # Foydalanuvchi modeli (Mongoose Schema)
│   ├── middlewares/
│   │   └── checkSubscription.js # Majburiy obunani va ro'yxatdan o'tishni boshqaruvchi middleware
│   ├── controllers/
│   │   └── botController.js  # Buyruqlar, menyular va callback'larni qayta ishlovchi controller
│   └── index.js              # Botning asosiy kirish nuqtasi va ishga tushirish fayli
├── .env                      # Maxfiy kalitlar va sozlamalar (.gitignore'da)
├── .env.example              # .env namunasi
├── package.json              # Loyiha bog'liqliklari va scriptlar
└── README.md                 # Siz o'qiyotgan qo'llanma
```

---

## ⚙️ Loyihani O'rnatish va Ishga Tushirish

### 1. Loyihani yuklab oling va papkaga o'ting
Agar terminalda bo'lsangiz, loyiha joylashgan papkada ekanligingizga ishonch hosil qiling.

### 2. Bog'liqliklarni (Packages) o'rnating
Terminalda quyidagi buyruqni bosing:
```bash
npm install
```

### 3. Konfiguratsiya faylini (`.env`) sozlang
Loyiha papkasida `.env` nomli fayl yarating (yoki `.env.example` faylidan nusxa oling) va quyidagi maxfiy ma'lumotlarni o'zingizga moslab to'ldiring:

```env
# Telegram Bot Sozlamalari
BOT_TOKEN=8626617217:AAGMah488EGUd7iSCqTgGbUnX-EUCzyCJw4
ADMIN_ID=5414733748

# MongoDB Ulanish Sozlamalari
# Mahalliy baza: mongodb://127.0.0.1:27017/english_pro_bot
# Bulutli baza (Atlas): mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname
MONGO_URI=mongodb://127.0.0.1:27017/english_pro_bot

# Majburiy Obuna Kanal Sozlamalari
# DIQQAT: Kanal IDsi Telegramda doimo -100 prefiksi bilan boshlanadi! (Masalan: -100123456789)
# Bot ushbu kanalda ADMINISTRATOR bo'lishi shart!
CHANNEL_ID=-100123456789
CHANNEL_URL=https://t.me/your_channel
```

> ⚠️ **MUHIM:** Telegram bot kanaldagi obunachilarni tekshira olishi uchun u albatta ushbu kanalning **Administratori** bo'lishi va foydalanuvchilar ro'yxatini ko'rish huquqiga ega bo'lishi shart.

### 4. Botni ishga tushirish

* **Rivojlantirish (Development) rejimida** (kod o'zgarganda avtomatik yangilanadi):
  ```bash
  npm run dev
  ```

* **Ishlab chiqarish (Production) rejimida**:
  ```bash
  npm start
  ```

---

## 🧠 Botning Asosiy Arxitektura Mantiqlari

1. **Foydalanuvchi Ro'yxatdan O'tishi**:
   * Foydalanuvchi botga xabar yuborganda, `checkSubscription` middleware'i avtomatik ravishda uning ID'si bazada (`User` modelida) mavjud yoki yo'qligini tekshiradi.
   * Agar foydalanuvchi tizimda yo'q bo'lsa, u yangi hujjat sifatida bazaga yoziladi (`telegramId`, `username`, `firstName`, `joinedAt` default: `Date.now`).

2. **Majburiy Obuna Tekshiruvi**:
   * Middleware `ctx.telegram.getChatMember(channelId, userId)` orqali foydalanuvchining kanaldagi rolini tekshiradi.
   * Agar a'zo bo'lmasa, so'rov to'xtatiladi va foydalanuvchiga obuna bo'lish so'ralgan chiroyli Inline tugmalar ko'rsatiladi:
     - 1-tugma: **📢 Kanalga o'tish** (havolasi `.env` dagi `CHANNEL_URL` dan olinadi)
     - 2-tugma: **✅ A'zo bo'ldim** (callback_data: `check_subscription`)
   * Agar obuna tasdiqlansa, `next()` chaqirilib, controllerga ruxsat beriladi va foydalanuvchi asosiy reply menyuni ko'radi ("📚 Darslar", "👤 Profil").

3. **Callback va Dinamik Vaqt Kontrolleri**:
   * Foydalanuvchi "✅ A'zo bo'ldim" tugmasini bosganda `botController` a'zolikni tekshiradi.
   * A'zo bo'lgan bo'lsa, eski inline xabar butunlay o'chiriladi va yangi chiroyli kutib olish xabari hamda asosiy menyu chiqadi.
   * Hali a'zo bo'lmagan bo'lsa, xabarning ostiga joriy vaqt (masalan `[Oxirgi tekshiruv vaqti: 17:05:23]`) qo'shilgan holda `editMessageText` qilinadi. Bu Telegram serverlaridan `message is not modified` xatoligini qaytishini 100% oldini oladi va tizim xavfsizligini ta'minlaydi.
