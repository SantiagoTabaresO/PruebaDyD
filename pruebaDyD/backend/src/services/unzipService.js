const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

class UnzipService {
  validateZip(zipPath) {
    if (!fs.existsSync(zipPath)) {
      throw new Error('El archivo ZIP no existe');
    }
  }

  async processZip(zipPath, originalName) {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const parentZip = originalName;
    const files = [];
    const skippedFiles = [];
    let totalSize = 0;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB por archivo

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const fileName = entry.entryName;
      const buffer = entry.getData();
      const size = buffer.length;

      if (size > MAX_SIZE) {
        console.warn(`Archivo demasiado grande, omitiendo: ${fileName}`);
        skippedFiles.push(fileName);
        continue;
      }

      const mimeType = this.getMimeType(fileName);

      files.push({
        name: fileName,
        originalName: fileName,
        size,
        mimeType
      });

      totalSize += size;
    }

    return {
      parentZip,
      totalFiles: files.length,
      totalSize,
      files,
      skippedFiles // 🔑 nuevo campo
    };
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const map = {
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.png': 'image/png'
    };
    return map[ext] || 'application/octet-stream';
  }
}

module.exports = new UnzipService();
