const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - Hack Club red
    ctx.fillStyle = '#ec3750';
    ctx.fillRect(0, 0, size, size);
    
    // Draw calendar icon
    const padding = size * 0.15;
    const rectSize = size - (padding * 2);
    
    // Calendar body (white)
    ctx.fillStyle = 'white';
    ctx.fillRect(padding, padding + size * 0.1, rectSize, rectSize - size * 0.1);
    
    // Calendar header (blue)
    ctx.fillStyle = '#338eda';
    ctx.fillRect(padding, padding, rectSize, size * 0.15);
    
    // Calendar rings
    const ringSize = size * 0.08;
    ctx.fillRect(padding + rectSize * 0.2, padding - ringSize * 0.5, ringSize * 0.4, ringSize);
    ctx.fillRect(padding + rectSize * 0.65, padding - ringSize * 0.5, ringSize * 0.4, ringSize);
    
    // Event dot
    if (size >= 48) {
        ctx.fillStyle = '#ec3750';
        ctx.beginPath();
        ctx.arc(size/2, size * 0.6, size * 0.12, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    return canvas;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'extension', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const sizes = [16, 48, 128];
sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Created ${filename}`);
});

console.log('\n🎯 All extension icons created successfully!');
