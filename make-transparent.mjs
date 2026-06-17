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
    
    // Pixel is considered white background if R, G, B are all >= 235 (near-white)
    const isWhite = (x, y) => {
      const idx = getIdx(x, y);
      return data[idx] >= 235 && data[idx+1] >= 235 && data[idx+2] >= 235;
    };
    
    // Queue borders
    for (let x = 0; x < width; x++) {
      if (isWhite(x, 0) && !visited[x]) {
        queue.push([x, 0]);
        visited[x] = 1;
      }
      if (isWhite(x, height - 1) && !visited[(height - 1) * width + x]) {
        queue.push([x, height - 1]);
        visited[(height - 1) * width + x] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      if (isWhite(0, y) && !visited[y * width]) {
        queue.push([0, y]);
        visited[y * width] = 1;
      }
      if (isWhite(width - 1, y) && !visited[y * width + (width - 1)]) {
        queue.push([width - 1, y]);
        visited[y * width + (width - 1)] = 1;
      }
    }
    
    // BFS Flood Fill from edges to convert outer white to transparent
    let qIdx = 0;
    while (qIdx < queue.length) {
      const [cx, cy] = queue[qIdx++];
      
      const idx = getIdx(cx, cy);
      data[idx+3] = 0; // Set alpha to 0
      
      const neighbors = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const vIdx = ny * width + nx;
          if (!visited[vIdx] && isWhite(nx, ny)) {
            visited[vIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
    
    // Trim/crop borders slightly to clean up edges if needed, then write out
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
