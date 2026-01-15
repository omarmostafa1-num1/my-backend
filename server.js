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
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const outputFormat = req.body.outputFormat;
        if (!outputFormat) {
            return res.status(400).json({ error: 'Output format is required.' });
        }

        uploadedFilePath = req.file.path;
        console.log(`Starting conversion: ${req.file.originalname} (${req.file.size} bytes) -> ${outputFormat}`);

        // Get extension without dot
        const inputFormat = path.extname(req.file.originalname).substring(1).toLowerCase();

        // Validation: Ensure inputFormat is not empty
        if (!inputFormat) {
            throw new Error("Could not determine input file format.");
        }

        // ConvertAPI Configuration
        const conversionOptions = {
            File: uploadedFilePath,
            StoreFile: true // Ensure file is stored for download
        };

        // Specific category options
        const category = req.body.category;
        if (category === 'image') {
            conversionOptions.ImageQuality = '90';
        }

        console.log(`Connecting to ConvertAPI... (${inputFormat} -> ${outputFormat})`);

        // Execute Conversion
        const result = await convertapi.convert(outputFormat, conversionOptions, inputFormat);

        console.log('Conversion successful. Downloading result...');

        // Save result
        // We use req.file.filename as base to avoid collisions
        const savedFiles = await result.saveFiles(path.join(__dirname, 'uploads'));

        if (!savedFiles || savedFiles.length === 0) {
            throw new Error("Conversion finished but no file was returned.");
        }

        resultFile = savedFiles[0];
        console.log(`File saved at: ${resultFile}`);

        // Send file
        res.download(resultFile, `converted-${Date.now()}.${outputFormat}`, (err) => {
            if (err) console.error("Error sending file:", err);

            // Clean up
            try {
                if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
                if (resultFile && fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr);
            }
        });

    } catch (error) {
        console.error('Conversion Error:', error);

        // Cleanup uploaded file on error
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
            try { fs.unlinkSync(uploadedFilePath); } catch (e) { }
        }

        // Handle specific ConvertAPI errors
        let statusCode = 500;
        let errorMessage = 'An error occurred during conversion.';

        if (error.code === 4000) {
            statusCode = 400;
            errorMessage = 'Parameter validation error. The file might be corrupted, empty, or the format is not supported for this conversion.';
            // Often happens if file size is 0 or format is wrong
            console.error("ConvertAPI 4000 Details:", error.data);
        } else if (error.code === 4010) {
            statusCode = 400;
            errorMessage = 'Invalid source file. The file format matches the extension but the content might be corrupted.';
        } else if (error.code === 401 || error.code === 403) {
            statusCode = 500; // Internal validation issue
            errorMessage = 'Authentication invalid with conversion service.';
        } else if (error.statusCode === 415) { // Unsupported Media Type
            statusCode = 400;
            errorMessage = 'This specific conversion (Input -> Output) is not supported by the converter.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(statusCode).json({ error: errorMessage, details: error.data || null });
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
