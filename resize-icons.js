const fs = require('fs');
const path = require('path');

// Simple image resizing using canvas in Node.js
async function resizeImage() {
  const { createCanvas, loadImage } = await import('canvas');
  
  const sizes = [192, 512];
  const inputPath = path.join(__dirname, 'public', 'logo-pwa-edit.png');
  
  for (const size of sizes) {
    const image = await loadImage(inputPath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(image, 0, 0, size, size);
    
    const outputPath = path.join(__dirname, 'public', `pwa-${size}x${size}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Created ${outputPath}`);
  }
}

resizeImage().catch(console.error);
