const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateOGImage() {
  // Create canvas with OG image dimensions
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Fill with tan background color (same as tailwind config)
  ctx.fillStyle = '#ffebb5';
  ctx.fillRect(0, 0, 1200, 630);
  
  try {
    // Load the brown hat image
    const hatImagePath = path.join(__dirname, '../public/images/brownhat.png');
    const img = await loadImage(hatImagePath);
    
    // Calculate size and position to center the image nicely
    const aspectRatio = img.width / img.height;
    const maxHeight = 300; // Max height for the hat
    const height = Math.min(maxHeight, img.height);
    const width = height * aspectRatio;
    
    // Center the image
    const x = (1200 - width) / 2;
    const y = (630 - height) / 2 - 50; // Slightly above center for text space
    
    ctx.drawImage(img, x, y, width, height);
    
    // Add text
    ctx.fillStyle = '#000000'; // black text
    ctx.font = 'bold 60px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Brown Straw Hat', 600, y + height + 80);
    
    ctx.font = '36px serif';
    ctx.fillText('Barter for Travelers', 600, y + height + 130);
    
    // Save the image
    const outputPath = path.join(__dirname, '../public/og-image.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ New OG image generated successfully with tan background!');
    console.log(`📁 Saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating OG image:', error);
  }
}

generateOGImage();