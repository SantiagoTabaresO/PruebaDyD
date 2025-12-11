const express = require('express');
const multer = require('multer');
const unzipService = require('../services/unzipService');
const firebaseService = require('../services/firebaseService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * Subir y procesar ZIP
 */
router.post('/upload', upload.single('zipFile'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const originalName = req.file.originalname;

    unzipService.validateZip(zipPath);
    const extractionResult = await unzipService.processZip(zipPath, originalName);

    const savedFiles = [];
    for (const file of extractionResult.files) {
      const metadata = {
        name: file.name,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType
      };
      const saved = await firebaseService.saveFileMetadata(metadata, extractionResult.parentZip);
      savedFiles.push(saved);
    }

    res.json({
      success: true,
      data: {
        zipName: extractionResult.parentZip,
        totalFiles: extractionResult.totalFiles,
        totalSize: extractionResult.totalSize,
        files: savedFiles,
        skippedFiles: extractionResult.skippedFiles // 🔑 nuevo
      }
    });
  } catch (error) {
    console.error('Error procesando ZIP:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * Listar archivos
 */
router.get('/list', async (req, res) => {
  try {
    const files = await firebaseService.listFiles();
    res.json({ success: true, data: { files } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
