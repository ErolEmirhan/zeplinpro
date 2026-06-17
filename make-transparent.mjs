import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = 'public/images/symbols';
if (!fs.existsSync(dir)) {
  console.error(`Directory ${dir} does not exist.`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function processFile(file) {
  const filePath = path.join(dir, file);
  const tempPath = filePath + '.temp.png';
  
  try {
    const image = sharp(filePath);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const visited = new Uint8Array(width * height);
    const queue = [];
    
    const getIdx = (x, y) => (y * width + x) * 4;
    
    // Detect white/grey background pixels including dark/light checkerboard patterns
    const isBackgroundPixel = (x, y) => {
      const idx = getIdx(x, y);
      const r = data[idx];
      const g = data[idx+1];
      const b = data[idx+2];
      const a = data[idx+3];
      
      // If already transparent
      if (a === 0) return true;
      
      // Bright white or near-white (R, G, B all high)
      const isWhite = r >= 195 && g >= 195 && b >= 195;
      
      // Grey checkerboard squares (R, G, B close to each other, light to dark grey)
      const isGrey = Math.abs(r - g) < 16 && 
                     Math.abs(g - b) < 16 && 
                     Math.abs(r - b) < 16 && 
                     r >= 60 && r <= 225;
                     
      return isWhite || isGrey;
    };
    
    // Seed queue with ALL background pixels within the outer 25-pixel margin
    const MARGIN = 25;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x < MARGIN || x >= width - MARGIN || y < MARGIN || y >= height - MARGIN) {
          if (isBackgroundPixel(x, y)) {
            const vIdx = y * width + x;
            if (!visited[vIdx]) {
              queue.push([x, y]);
              visited[vIdx] = 1;
            }
          }
        }
      }
    }
    
    // BFS Flood Fill to clear background
    let qIdx = 0;
    while (qIdx < queue.length) {
      const [cx, cy] = queue[qIdx++];
      
      const idx = getIdx(cx, cy);
      data[idx+3] = 0; // Make transparent
      
      const neighbors = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const vIdx = ny * width + nx;
          if (!visited[vIdx] && isBackgroundPixel(nx, ny)) {
            visited[vIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
    
    // Write out the processed raw pixel data to PNG
    await sharp(data, {
      raw: {
        width,
        height,
        channels: 4
      }
    }).png().toFile(tempPath);
    
    fs.renameSync(tempPath, filePath);
    console.log(`Processed ${file} successfully.`);
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

async function run() {
  console.log(`Starting transparency processing for ${files.length} files...`);
  for (const file of files) {
    await processFile(file);
  }
  console.log('All assets processed successfully.');
}

run();
