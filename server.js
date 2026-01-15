// ===================================
// استيراد المكتبات المطلوبة
// ===================================
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const conversions = require("./conversions");
const ConvertApi = require("convertapi");
const convertapi = new ConvertApi(process.env.ConvertAPI_SECRET);


// ===================================
// إعداد التطبيق
// ===================================
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ConvertAPI Configuration


// ===================================
// إعداد Middleware
// ===================================
// لخدمة الملفات الثابتة (HTML, CSS, JS)

// ===================================
// إعداد Multer لرفع الملفات
// ===================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        res.json({
            success: true,
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ===================================
// نقطة النهاية الرئيسية
// ===================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================================
// نقطة نهاية التحويل
// ===================================
app.post('/api/convert', upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let resultFile = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
        }

        const outputFormat = req.body.outputFormat;
        if (!outputFormat) {
            return res.status(400).json({ error: 'صيغة الإخراج مطلوبة' });
        }

        uploadedFilePath = req.file.path;
        console.log(`بدء التحويل: ${req.file.originalname} → ${outputFormat}`);

        // إعداد خيارات التحويل
        const conversionOptions = {
            File: uploadedFilePath
        };

        // إضافة خيارات خاصة حسب نوع الملف
        const category = req.body.category;
        if (category === 'image') {
            conversionOptions.ImageQuality = '90';
        }

        // تنفيذ التحويل باستخدام ConvertAPI SDK
        // ملاحظة: نقوم بتحويل من الصيغة الأصلية إلى الصيغة المطلوبة
        const inputFormat = path.extname(req.file.originalname).substring(1).toLowerCase();

        console.log(`جارٍ الاتصال بـ ConvertAPI... (${inputFormat} -> ${outputFormat})`);
        const result = await convertapi.convert(outputFormat, conversionOptions, inputFormat);

        console.log('تم التحويل بنجاح، جاري التنزيل...');

        // حفظ الملف المحول
        const savedFiles = await result.saveFiles(path.join(__dirname, 'uploads'));
        resultFile = savedFiles[0];

        console.log(`تم حفظ الملف: ${resultFile}`);

        // إرسال الملف للمستخدم
        res.download(resultFile, `converted.${outputFormat}`, (err) => {
            // تنظيف الملفات
            if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
            if (resultFile && fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
        });

    } catch (error) {
        console.error('خطأ في التحويل:', error);

        // تنظيف الملفات
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        if (resultFile && fs.existsSync(resultFile)) fs.unlinkSync(resultFile);

        let errorMessage = 'حدث خطأ أثناء التحويل';
        if (error.message) errorMessage = error.message;

        res.status(500).json({ error: errorMessage });
    }
});

// ===================================
// نقطة نهاية للتحقق من حالة الخادم
// ===================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'الخادم يعمل بشكل صحيح',
        api: 'ConvertAPI SDK',
        timestamp: new Date().toISOString()
    });
});

// ===================================
// تشغيل الخادم
// ===================================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🔑 ConvertAPI SDK متصل`);
    console.log('='.repeat(50));
});

// ===================================
// معالجة إيقاف التطبيق
// ===================================
process.on('SIGINT', () => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadDir)) {
        fs.readdirSync(uploadDir).forEach(file => fs.unlinkSync(path.join(uploadDir, file)));
    }
    process.exit(0);
});
