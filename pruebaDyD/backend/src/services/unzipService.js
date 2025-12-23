const AdmZip = require('adm-zip');
const path = require('path');

class UnzipService {
  validateZip(zipPath) {
    if (!zipPath) {
      throw new Error('ZIP inválido');
    }
  }

  async processZip(zipPath, originalName) {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const files = [];
    const skippedFiles = [];
    let totalSize = 0;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const buffer = entry.getData();
      if (!buffer || !buffer.length) continue;

      if (buffer.length > MAX_SIZE) {
        skippedFiles.push(entry.entryName);
        continue;
      }

      const fileName = path.basename(entry.entryName);

      files.push({
        name: fileName,
        originalName: fileName,
        buffer,
        size: buffer.length,
        mimeType: this.getMimeType(fileName)
      });

      totalSize += buffer.length;
    }

    return {
      parentZip: originalName,
      files,
      totalFiles: files.length,
      totalSize,
      skippedFiles
    };
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    console.log(`MIME type for ${fileName}: ${ext}`);
    return {
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.txt': 'text/plain'
    }[ext] || 'application/octet-stream';
  }
}

module.exports = new UnzipService();
