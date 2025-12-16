const admin = require('firebase-admin');
const crypto = require('crypto');
const bucket = admin.storage().bucket();

class FirebaseService {
  constructor() {
    this.db = admin.firestore();
    this.bucket = admin.storage().bucket(); // emulator usa default
  }

  /*Subir archivo al Storage Emulator*/
  async uploadFile(buffer, filePath, contentType) {
    if (!buffer) {
      throw new Error('Buffer vacío: no se puede subir archivo');
    }

    const file = this.bucket.file(filePath);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType
      }
    });

    return {
      path: filePath
    };
  }


  /*Guardar metadatos en Firestore*/
  async saveFileMetadata(fileData, parentZip) {
    try {
      const downloadKey = crypto.randomBytes(16).toString('hex');

      const fileDoc = {
        ...fileData,
        parentZip,
        downloadKey,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        downloadCount: 0
      };

      const ref = await this.db.collection('files').add(fileDoc);

      return {
        id: ref.id,
        ...fileDoc
      };
    } catch (error) {
      console.error('Error guardando metadatos:', error);
      throw error;
    }
  }


  // Obtener archivo por ID (Firestore)
  async getFileById(fileId) {
    const doc = await this.db.collection('files').doc(fileId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }


  // Obtener stream del archivo desde Storage Emulator
  getFileStream(filePath) {
    if (!filePath) {
      throw new Error('A file name must be specified');
    }

    return this.bucket.file(filePath).createReadStream();
  }


  /* Listar archivos*/
  async listFiles(filters = {}) {
  try {
    const snapshot = await this.db
      .collection('files')
      .orderBy('uploadedAt', 'desc')
      .get();

    let files = [];

    snapshot.forEach(doc => {
      files.push({
        id: doc.id,
        ...doc.data()
      });
    });

    //  Filtros en memoria (seguro para emulator)
    if (filters.parentZip) {
      files = files.filter(
        file => file.parentZip === filters.parentZip
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      files = files.filter(file =>
        file.name.toLowerCase().includes(search)
      );
    }

    return files;

  } catch (error) {
    console.error('Error obteniendo lista de archivos:', error);
    throw new Error(`Error al obtener lista: ${error.message}`);
  }
}

}

module.exports = new FirebaseService();
