const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const AdmZip = require("adm-zip");

admin.initializeApp();

// Función que se ejecuta cuando se sube un archivo a Storage
exports.unzipFile = functions.storage.object().onFinalize(async (object) => {
  try {
    const fileBucket = object.bucket; // Bucket de Storage
    const filePath = object.name; // Ruta del archivo
    const contentType = object.contentType; // Tipo de contenido

    // Verificar que sea un archivo ZIP
    if (!contentType || !contentType.includes("zip")) {
      console.log("No es un archivo ZIP. Saltando...");
      return null;
    }

    // Obtener el nombre del archivo sin extensión
    const fileName = path.basename(filePath, ".zip");
    const bucket = admin.storage().bucket(fileBucket);
    
    // Rutas temporales
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const tempDir = path.join(os.tmpdir(), fileName);

    // Crear directorio temporal
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    console.log(`Descargando ZIP: ${filePath}`);
    
    // Descargar el archivo ZIP
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log(`ZIP descargado en: ${tempFilePath}`);

    // Descomprimir el archivo
    const zip = new AdmZip(tempFilePath);
    const zipEntries = zip.getEntries();
    
    console.log(`Descomprimiendo ${zipEntries.length} archivos...`);

    const extractedFiles = [];

    // Procesar cada archivo dentro del ZIP
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const entryName = entry.entryName;
        const entryPath = path.join(tempDir, entryName);
        
        // Extraer el archivo
        zip.extractEntryTo(entry, tempDir, false, true);
        
        // Subir a Storage en una carpeta específica
        const destination = `unzipped/${fileName}/${entryName}`;
        await bucket.upload(entryPath, {
          destination: destination,
          metadata: {
            contentType: getContentType(entryName),
          },
        });

        extractedFiles.push({
          name: entryName,
          path: destination,
          size: entry.header.size,
          uploadedAt: new Date().toISOString()
        });

        console.log(`Archivo subido: ${destination}`);
      }
    }

    // Guardar información en Firestore
    const db = admin.firestore();
    const batch = db.batch();
    
    const fileDocRef = db.collection("unzipped_files").doc(fileName);
    batch.set(fileDocRef, {
      originalZip: filePath,
      fileName: fileName,
      fileCount: extractedFiles.length,
      extractedFiles: extractedFiles,
      extractedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed"
    });

    // Guardar cada archivo individualmente para fácil acceso
    for (const file of extractedFiles) {
      const fileRef = db.collection("files").doc();
      batch.set(fileRef, {
        ...file,
        parentZip: fileName,
        downloadKey: generateRandomKey(), // Clave para descarga
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`Información guardada en Firestore para: ${fileName}`);

    // Limpiar archivos temporales
    fs.unlinkSync(tempFilePath);
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`Proceso completado para: ${fileName}`);
    return null;

  } catch (error) {
    console.error("Error en la descompresión:", error);
    
    // Guardar error en Firestore
    const db = admin.firestore();
    const fileName = path.basename(object.name, ".zip");
    
    await db.collection("unzipped_files").doc(fileName).set({
      originalZip: object.name,
      fileName: fileName,
      error: error.message,
      extractedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "failed"
    }, { merge: true });

    throw error;
  }
});

// Función auxiliar para determinar el tipo de contenido
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return types[ext] || 'application/octet-stream';
}

// Generar clave aleatoria para descarga
function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Función opcional: Limpiar archivos antiguos
exports.cleanOldFiles = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const db = admin.firestore();
  const storage = admin.storage();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // Archivos de más de 7 días
  
  const snapshot = await db.collection("unzipped_files")
    .where("extractedAt", "<", cutoffDate)
    .get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Eliminar de Firestore
    await db.collection("unzipped_files").doc(doc.id).delete();
    
    // Eliminar archivos de Storage
    const bucket = storage.bucket();
    const prefix = `unzipped/${data.fileName}/`;
    
    const [files] = await bucket.getFiles({ prefix });
    await Promise.all(files.map(file => file.delete()));
    
    console.log(`Eliminado: ${data.fileName}`);
  }
  
  return null;
});