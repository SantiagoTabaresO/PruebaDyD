<template>
  <div class="file-manager">
    <div class="manager-header">
      <h1 class="title">GESTIÓN DE ARCHIVOS ZIP</h1>
      <p class="subtitle">Sube, descomprime y descarga archivos</p>
      <p class="subtitle-2">✅ Usando JSZip en frontend - Sin Cloud Functions ✅</p>
    </div>

    <div class="manager-container">
      <!-- Panel izquierdo: Subida de archivos -->
      <div class="upload-panel">
        <FileUpload 
          @file-uploaded="handleFileUploaded" 
          @view-files="loadFiles" 
        />

        
        <div class="stats-card">
          <h3>📊 Estadísticas del Sistema</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalFiles }}</span>
              <span class="stat-label">Archivos Totales</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalZips }}</span>
              <span class="stat-label">ZIPs Procesados</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalSize }} MB</span>
              <span class="stat-label">Espacio Usado</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h4>ℹ️ Información del Sistema</h4>
          <ul>
            <li>✅ Descompresión en el navegador (JSZip)</li>
            <li>✅ No requiere Cloud Functions</li>
            <li>✅ Plan Spark gratuito de Firebase</li>
            <li>✅ Límite: Archivos ZIP hasta 50MB</li>
            <li>✅ Claves de seguridad para descargas</li>
          </ul>
        </div>
      </div>

      <!-- Panel derecho: Listado de archivos -->
      <div class="files-panel">
        <FileList 
          :files="filesList" 
          @download-file="handleDownload"
          @refresh="loadFiles"
        />
      </div>
    </div>

    <!-- Modal de descarga -->
    <DownloadModal 
      v-if="showDownloadModal"
      :file="selectedFile"
      @confirm="processDownload"
      @cancel="showDownloadModal = false"
    />

    <!-- Notificaciones -->
    <div v-if="notification.show" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '@/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import FileUpload from './FileUpload.vue'
import FileList from './FileList.vue'
import DownloadModal from './DownloadModal.vue'

// Estado
const filesList = ref([])
const stats = ref({
  totalFiles: 0,
  totalZips: 0,
  totalSize: 0
})
const selectedFile = ref(null)
const showDownloadModal = ref(false)
const notification = ref({
  show: false,
  message: '',
  type: 'info'
})

// Mostrar notificación
const showNotification = (message, type = 'info') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Cargar archivos desde Firestore
const loadFiles = () => {
  const q = query(collection(db, 'files'), orderBy('uploadedAt', 'desc'))
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    filesList.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Calcular estadísticas
    calculateStats()
  })
  
  return unsubscribe
}

// Calcular estadísticas
const calculateStats = () => {
  const totalFiles = filesList.value.length
  const totalZips = [...new Set(filesList.value.map(f => f.parentZip))].length
  const totalSize = filesList.value.reduce((sum, file) => sum + (file.size || 0), 0) / (1024 * 1024)
  
  stats.value = {
    totalFiles,
    totalZips,
    totalSize: totalSize.toFixed(2)
  }
}

// Manejar subida de archivo
const handleFileUploaded = (data) => {
  showNotification(`✅ ${data.fileCount} archivos descomprimidos de "${data.zipName}"`, 'success')
  loadFiles() // Recargar lista
}

// Manejar descarga
const handleDownload = (file) => {
  selectedFile.value = file
  showDownloadModal.value = true
}

// Procesar descarga
const processDownload = (key) => {
  showNotification('✅ Descarga completada', 'success')
}

// Inicializar
onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.file-manager {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1929 0%, #0d1b2a 100%);
  padding: 2rem;
}

.manager-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(0, 180, 216, 0.3);
}

.title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #00b4d8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.subtitle {
  font-size: 1.1rem;
  color: #90e0ef;
  font-weight: 300;
  margin-bottom: 0.5rem;
}

.subtitle-2 {
  font-size: 0.9rem;
  color: #4cc9f0;
  background: rgba(76, 201, 240, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  display: inline-block;
}

.manager-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.upload-panel, .files-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-card {
  margin-top: 2rem;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(0, 180, 216, 0.2);
}

.stats-card h3 {
  color: #00b4d8;
  margin-bottom: 1rem;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: transform 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
  background: rgba(0, 180, 216, 0.15);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #00b4d8;
}

.stat-label {
  font-size: 0.9rem;
  color: #90e0ef;
  margin-top: 0.5rem;
  text-align: center;
}

.info-card {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-card h4 {
  color: #00b4d8;
  margin-bottom: 1rem;
}

.info-card ul {
  list-style: none;
  padding: 0;
}

.info-card li {
  color: #90e0ef;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.info-card li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4cc9f0;
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: linear-gradient(45deg, #00b894, #00a085);
  border-left: 4px solid #00ffcc;
}

.notification.info {
  background: linear-gradient(45deg, #0984e3, #0770c4);
  border-left: 4px solid #74b9ff;
}

.notification.error {
  background: linear-gradient(45deg, #d63031, #c23636);
  border-left: 4px solid #ff7675;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .manager-container {
    grid-template-columns: 1fr;
  }
  
  .title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .file-manager {
    padding: 1rem;
  }
  
  .title {
    font-size: 1.8rem;
  }
}
</style>