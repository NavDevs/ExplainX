const Jimp = require('jimp');
const path = require('path');

const inputFile = path.join(__dirname, 'src/icons/icon128.jpg');
const sizes = [16, 32, 48, 128];

async function generateIcons() {
  const img = await Jimp.read(inputFile);
  for (const size of sizes) {
    const outFile = path.join(__dirname, `src/icons/icon${size}.png`);
    await img.clone().resize(size, size).writeAsync(outFile);
    console.log(`✅ icon${size}.png`);
  }
  console.log('All PNG icons generated!');
}

generateIcons().catch(err => console.error(err));
