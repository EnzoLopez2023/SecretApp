import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_DIR = path.join(__dirname, 'PDFs');
const OUTPUT_DIR = path.join(__dirname, 'PDF_Images');
const DPI = 150;

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

async function convertPdfToImages(pdfPath, pdfName) {
  try {
    console.log('Processing: ' + pdfName);
    const baseName = path.parse(pdfName).name;
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const numPages = pdfDoc.getPageCount();
    console.log('  Pages: ' + numPages);
    
    const convertedFiles = [];
    for (let i = 0; i < numPages; i++) {
      const pageNum = i + 1;
      const outputFile = path.join(OUTPUT_DIR, baseName + '_page_' + String(pageNum).padStart(3, '0') + '.jpg');
      const command = 'magick -density ' + DPI + ' -quality 90 \"' + pdfPath + '[' + i + ']\" \"' + outputFile + '\"';
      
      try {
        await execAsync(command, { timeout: 30000 });
        convertedFiles.push(path.basename(outputFile));
      } catch (err) {
        console.log('  Error on page ' + pageNum + ': ' + err.message);
      }
    }
    
    console.log('  Converted ' + convertedFiles.length + '/' + numPages + ' pages');
    return { success: convertedFiles.length > 0, pdfName, pages: numPages, converted: convertedFiles.length };
  } catch (error) {
    console.log('  Error: ' + error.message);
    return { success: false, pdfName, error: error.message };
  }
}

async function main() {
  console.log('PDF to Image Converter Starting...\n');
  const startTime = Date.now();
  await ensureOutputDir();
  
  const files = await fs.readdir(PDF_DIR);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('Found ' + pdfFiles.length + ' PDFs\n');
  
  let success = 0;
  let fail = 0;
  
  for (let i = 0; i < pdfFiles.length; i++) {
    console.log('[' + (i+1) + '/' + pdfFiles.length + ']');
    const result = await convertPdfToImages(path.join(PDF_DIR, pdfFiles[i]), pdfFiles[i]);
    if (result.success) success++; else fail++;
    
    if ((i+1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('\nProgress: ' + (i+1) + '/' + pdfFiles.length + ' | ' + elapsed + 's\n');
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\nCompleted!');
  console.log('Success: ' + success + ' | Failed: ' + fail);
  console.log('Time: ' + duration + 's (' + (duration/60).toFixed(1) + ' min)');
}

main().catch(console.error);
