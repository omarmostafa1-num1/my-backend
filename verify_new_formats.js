const conversions = require('./conversions');
const assert = require('assert');

// Test Image -> PDF
console.log("Testing Image -> PDF support...");
const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
let imageToPdfSupported = true;

imageFormats.forEach(fmt => {
    if (!conversions.image[fmt].includes('pdf')) {
        console.error(`❌ ${fmt} does not support conversion to PDF`);
        imageToPdfSupported = false;
    }
});

if (imageToPdfSupported) {
    console.log("✅ All image formats support conversion to PDF");
}

// Test PPTX -> PDF
console.log("\nTesting PPTX -> PDF support...");
if (conversions.document.pptx && conversions.document.pptx.includes('pdf')) {
    console.log("✅ PPTX -> PDF is supported");
} else {
    console.error("❌ PPTX -> PDF is NOT supported");
}

console.log("\nVerification Complete.");
