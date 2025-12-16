const express = require('express');
const multer = require('multer');
const unzipService = require('../services/unzipService');
const firebaseService = require('../services/firebaseService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * SUBIR ZIP
 */
router.post('/upload', upload.single('zipFile'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const zipName = req.file.originalname;

    unzipService.validateZip(zipPath);
    const result = await unzipService.processZip(zipPath, zipName);

    const savedFiles = [];

    for (const file of result.files) {
      const storagePath = `zips/${result.parentZip}/${file.name}`;

      await firebaseService.uploadFile(
        file.buffer,
        storagePath,
        file.mimeType
      );

      const saved = await firebaseService.saveFileMetadata({
        name: file.name,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        path: storagePath
      }, result.parentZip);

      savedFiles.push(saved);
    }

    res.json({
      success: true,
      data: {
        zipName: result.parentZip,
        uploadedFiles: savedFiles.length,
        totalFiles: result.totalFiles,
        totalSize: result.totalSize,
        files: savedFiles,
        skippedFiles: result.skippedFiles
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * LISTAR
 */
router.get('/list', async (req, res) => {
  const files = await firebaseService.listFiles();
  res.json({ success: true, data: { files } });
});

/**
 * DESCARGAR
 */
router.post('/download', async (req, res) => {
  const { fileId, downloadKey } = req.body;

  const file = await firebaseService.getFileById(fileId);

  if (!file || file.downloadKey !== downloadKey) {
    return res.status(403).json({ error: { message: 'Acceso denegado' } });
  }

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.originalName}"`
  );
  res.setHeader('Content-Type', file.mimeType);

  const stream = firebaseService.getFileStream(file.path);
  stream.pipe(res);
});

module.exports = router;
