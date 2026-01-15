// backend/conversions.js
// جميع التحويلات المدعومة في الموقع

module.exports = {
    // ================== IMAGES ==================
    image: {
        jpg: ["jpeg", "png", "webp", "bmp", "pdf"],
        jpeg: ["jpg", "png", "webp", "bmp", "pdf"],
        png: ["jpg", "jpeg", "webp", "bmp", "pdf"],
        webp: ["jpg", "jpeg", "png", "pdf"],
        bmp: ["jpg", "jpeg", "png", "webp", "pdf"],
        pdf: ["jpg", "jpeg", "png", "webp"]
    },

    // ================= DOCUMENTS =================
    document: {
        pdf: ["docx", "txt", "pptx"],
        docx: ["pdf", "txt", "pptx"],
        txt: ["pdf", "docx"],
        pptx: ["pdf", "docx", "txt"]
    },

    // ================== ARCHIVES =================
    // ⚠️ TAR غير مدعوم بالـ API لذلك غير مضاف
    archive: {
        zip: ["rar", "7z"],
        rar: ["zip", "7z"],
        "7z": ["zip", "rar"]
    },

    // =================== AUDIO ===================
    audio: {
        mp3: ["wav", "aac", "ogg"],
        wav: ["mp3", "aac", "ogg"],
        aac: ["mp3", "wav", "ogg"],
        ogg: ["mp3", "wav", "aac"]
    },

    // =================== VIDEO ===================
    video: {
        mp4: ["avi", "mkv", "webm"],
        avi: ["mp4", "mkv"],
        mkv: ["mp4", "avi"],
        webm: ["mp4"]
    }
};