const unzipService = require('../services/unzipService');
const firebaseService = require('../services/firebaseService');
const fs = require('fs').promises;
const path = require('path');

class FileController {

  /**
   * Sube y procesa un archivo ZIP
   */
  async uploadZip(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No se proporcionó ningún archivo'
          }
        });
      }

      console.log(`Archivo recibido: ${req.file.originalname} (${req.file.size} bytes)`);

      // 1. Validar ZIP
      await unzipService.validateZip(req.file.path);

      // 2. Obtener información del ZIP
      const zipInfo = await unzipService.getZipInfo(req.file.path);

      // 3. Procesar ZIP (descomprimir)
      const extractionResult = await unzipService.processZip(
        req.file.path,
        req.file.originalname
      );

      console.log(`ZIP procesado: ${extractionResult.totalFiles} archivos extraídos`);

      // 4. Subir archivos al Storage Emulator y guardar metadatos
      const uploadedFiles = [];

      for (const file of extractionResult.files) {
        try {
          const uploadResult = await firebaseService.uploadFile(
            file.buffer,
            file.name,
            file.mimeType,
            extractionResult.parentZip
          );

          const metadata = await firebaseService.saveFileMetadata({
            name: file.name,
            size: file.size,
            contentType: file.mimeType,
            storagePath: uploadResult.path,
            bucket: uploadResult.bucket
          }, extractionResult.parentZip);

          uploadedFiles.push({
            id: metadata.id,
            name: file.name,
            size: file.size
          });
        } catch (err) {
          console.error(`Error subiendo ${file.name}`, err);
        }
      }


      await fs.unlink(req.file.path).catch(console.error);

      res.status(201).json({
        success: true,
        message: `ZIP procesado exitosamente`,
        data: {
          zipName: extractionResult.parentZip,
          originalName: req.file.originalname,
          totalFiles: extractionResult.totalFiles,
          uploadedFiles: uploadedFiles.length,
          totalSize: extractionResult.totalSize,
          files: uploadedFiles.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            url: f.url
          })),
          statistics: {
            ...zipInfo,
            successfulUploads: uploadedFiles.length,
            failedUploads: extractionResult.totalFiles - uploadedFiles.length
          }
        }
      });

    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      next(error);
    }
  }

  /**
   * Obtiene lista de archivos
   */
  async listFiles(req, res, next) {
    try {
      const {
        parentZip,
        search,
        limit = 50,
        page = 1
      } = req.query;

      const filters = {};
      if (parentZip) filters.parentZip = parentZip;
      if (search) filters.search = search;

      const files = await firebaseService.listFiles(filters);

      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedFiles = files.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          files: paginatedFiles.map(file => ({
            id: file.id,
            name: file.name,
            originalName: file.originalName,
            size: file.size,
            url: file.url,
            parentZip: file.parentZip,
            uploadedAt: file.uploadedAt,
            downloadCount: file.downloadCount
          })),
          pagination: {
            total: files.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(files.length / parseInt(limit)),
            hasNext: endIndex < files.length,
            hasPrev: startIndex > 0
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Valida y genera URL de descarga
   */
  async downloadFile(req, res, next) {
    try {
      const { fileId, downloadKey } = req.body;

      if (!fileId || !downloadKey) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PARAMS',
            message: 'Se requieren fileId y downloadKey'
          }
        });
      }

      const downloadInfo = await firebaseService.validateAndGetDownload(fileId, downloadKey);

      res.json({
        success: true,
        data: {
          downloadUrl: downloadInfo.url,
          fileName: downloadInfo.name,
          contentType: downloadInfo.contentType,
          directDownload: true
        }
      });

    } catch (error) {
      if (error.message === 'Clave de descarga inválida') {
        return res.status(403).json({
          error: {
            code: 'INVALID_KEY',
            message: 'La clave de descarga es incorrecta'
          }
        });
      }

      if (error.message === 'Archivo no encontrado') {
        return res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'El archivo no existe'
          }
        });
      }

      next(error);
    }
  }

  /**
   * Obtiene estadísticas
   */
  async getStats(req, res, next) {
    try {
      const files = await firebaseService.listFiles();

      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
        totalDownloads: files.reduce((sum, file) => sum + (file.downloadCount || 0), 0),
        zips: {},
        byType: {}
      };

      files.forEach(file => {
        const zipName = file.parentZip || 'Sin categoría';
        stats.zips[zipName] = (stats.zips[zipName] || 0) + 1;

        const ext = path.extname(file.name).toLowerCase() || '.unknown';
        stats.byType[ext] = (stats.byType[ext] || 0) + 1;
      });

      // 🔥 FIX: reemplazo de this.formatBytes que causaba 500
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      res.json({
        success: true,
        data: {
          ...stats,
          formattedSize: formatBytes(stats.totalSize),
          averageSize: stats.totalFiles > 0
            ? formatBytes(stats.totalSize / stats.totalFiles)
            : '0 Bytes'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FileController();
