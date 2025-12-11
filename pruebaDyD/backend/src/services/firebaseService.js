const admin = require('firebase-admin');
const crypto = require('crypto');

class FirebaseService {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Guarda información del archivo en Firestore
   */
  async saveFileMetadata(fileData, parentZip) {
    try {
      const downloadKey = crypto.randomBytes(16).toString('hex');
      
      const fileDoc = {
        ...fileData,
        downloadKey,
        parentZip,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        downloadCount: 0,
        lastDownloaded: null
      };

      const docRef = await this.db.collection('files').add(fileDoc);
      
      return {
        id: docRef.id,
        ...fileDoc,
        downloadKey
      };
    } catch (error) {
      console.error('Error guardando metadatos:', error);
      throw new Error(`Error al guardar metadatos: ${error.message}`);
    }
  }

  /**
   * Obtiene lista de archivos desde Firestore
   */
  async listFiles(filters = {}) {
    try {
      let query = this.db.collection('files');
      
      if (filters.parentZip) {
        query = query.where('parentZip', '==', filters.parentZip);
      }
      
      query = query.orderBy('uploadedAt', 'desc');
      
      const snapshot = await query.get();
      const files = [];
      
      snapshot.forEach(doc => {
        files.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return files;
    } catch (error) {
      console.error('Error obteniendo lista de archivos:', error);
      throw new Error(`Error al obtener lista: ${error.message}`);
    }
  }
}

module.exports = new FirebaseService();
