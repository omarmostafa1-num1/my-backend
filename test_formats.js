require('dotenv').config();
const ConvertApi = require("convertapi");
const fs = require('fs');
const path = require('path');

const convertapi = new ConvertApi(process.env.ConvertAPI_SECRET);

async function testConversion(inputFormat, outputFormat) {
    console.log(`Testing ${inputFormat} -> ${outputFormat}...`);
    try {
        // We need a dummy file. 
        // For txt->pdf, a text file is enough.
        // For mp3->wav, we can't easily fake it without a real file, 
        // but we can check if ConvertAPI accepts the job request if we had a file.
        // Or we can try to initiate it with a dummy file and see if it fails with "Invalid file" (good) or "Conversion not supported" (what we want to check).

        const dummyFile = path.join(__dirname, `test.${inputFormat}`);
        fs.writeFileSync(dummyFile, "dummy content");

        // This will likely fail with "File corrupted" or similar for binary formats,
        // but if it says "Input format not supported", we know the issue.
        try {
            const result = await convertapi.convert(outputFormat, { File: dummyFile }, inputFormat);
            console.log(`✅ ${inputFormat} -> ${outputFormat} seems supported (or at least tried to convert).`);
        } catch (e) {
            console.log(`❌ ${inputFormat} -> ${outputFormat} failed: ${e.message}`);
        } finally {
            if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
        }

    } catch (err) {
        console.error("Script error:", err);
    }
}

async function runTests() {
    // Document
    await testConversion('txt', 'pdf');

    // Archive (often not supported by general convert)
    await testConversion('zip', 'rar');

    // Audio
    await testConversion('mp3', 'wav');

    // Video
    await testConversion('mp4', 'avi');
}

runTests();
