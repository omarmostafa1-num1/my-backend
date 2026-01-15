require('dotenv').config();
const ConvertApi = require("convertapi");
const fs = require('fs');
const path = require('path');

const convertapi = new ConvertApi(process.env.ConvertAPI_SECRET);

// Tiny valid MP3 frame (MPEG 1 Layer 3) - standard header
const mp3Hex = "FFFB9064000000000000000000000000";
const mp3Buffer = Buffer.from(mp3Hex, 'hex');

// Tiny valid ZIP file
const zipHex = "504B0506000000000000000000000000000000000000";
const zipBuffer = Buffer.from(zipHex, 'hex');

async function testConversion(inputFormat, outputFormat, fileBuffer) {
    console.log(`Testing ${inputFormat} -> ${outputFormat} with valid header...`);
    const dummyFile = path.join(__dirname, `test_real.${inputFormat}`);
    fs.writeFileSync(dummyFile, fileBuffer);

    try {
        const result = await convertapi.convert(outputFormat, { File: dummyFile }, inputFormat);
        console.log(`✅ ${inputFormat} -> ${outputFormat} SUCCESS`);
        // Clean up result files?
    } catch (e) {
        console.log(`❌ ${inputFormat} -> ${outputFormat} failed: ${e.message}`);
        if (e.response) {
            console.log("Details:", JSON.stringify(e.response.data));
        }
    } finally {
        if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
    }
}

async function runTests() {
    // Test Audio
    await testConversion('mp3', 'wav', mp3Buffer);

    // Test Archive
    // Note: rar creation usually unsupported.
    await testConversion('zip', 'rar', zipBuffer);

    // Test Archive 2
    await testConversion('rar', 'zip', zipBuffer); // Using zip buffer as rar might fail 415, but let's see if endpoint exists.
}

runTests();
