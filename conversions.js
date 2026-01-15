module.exports = {
    // ================== IMAGES ==================
    image: {
        jpg: ["png", "webp"],
        jpeg: ["png", "webp"],
        png: ["jpg", "webp"],
        webp: ["jpg", "png"],
        bmp: ["jpg", "png"]
    },

    // ================= DOCUMENTS =================
    document: {
        pdf: ["docx", "txt", "jpg", "png"],
        docx: ["pdf", "txt"],
        txt: ["pdf"],
        ppt: ["pdf"],
        pptx: ["pdf"],
        xls: ["pdf"],
        xlsx: ["pdf"]
    },

    // ================== AUDIO ==================
    audio: {
        mp3: ["wav", "aac", "ogg"],
        wav: ["mp3", "aac", "ogg"],
        aac: ["mp3", "wav", "ogg"],
        ogg: ["mp3", "wav", "aac"]
    },

    // =================== VIDEO ===================
    // Note: Video conversion in ConvertAPI is limited and may require specific plans.
    // We strictly list formats that are commonly attempted.
    // If a specific pair fails, the server error handler will now inform the user.
    video: {
        mp4: ["mp3", "webm"], // MP4 to Audio (MP3) or Web-friendly video (WEBM)
        webm: ["mp4", "mp3"],
        mkv: ["mp4", "mp3"]
    }
};