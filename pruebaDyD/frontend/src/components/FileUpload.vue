<template>
  <div class="enhanced-file-upload">
    <!-- Encabezado con estilo mejorado -->
    <div class="upload-header-section">
      <div class="header-icon">🚀</div>
      <div class="header-content">
        <h1 class="main-title">SUBE TU ARCHIVO ZIP</h1>
        <p class="subtitle">El backend se encargará de descomprimirlo y almacenarlo</p>
        <div class="tech-badges">
          <span class="badge">Backend Node.js</span>
          <span class="badge">Firebase Storage</span>
          <span class="badge">Claves Seguras</span>
        </div>
      </div>
    </div>

    <div class="upload-layout">
      <!-- Panel izquierdo: Área de subida -->
      <div class="upload-panel">
        <!-- Área de arrastrar y soltar -->
        <div class="drag-drop-area" 
             @dragover.prevent="handleDragOver"
             @dragleave="handleDragLeave"
             @drop.prevent="handleDrop"
             :class="{ 'drag-over': isDragOver }"
        >
          <div class="drag-icon">
            <div class="icon-circle">
              📦
            </div>
          </div>
          
          <div class="drag-content">
            <h3>Arrastra tu archivo ZIP aquí</h3>
            <p class="drag-subtitle">O haz clic para seleccionar</p>
            
            <input 
              type="file" 
              ref="fileInput"
              accept=".zip,.ZIP"
              @change="handleFileSelect"
              class="file-input"
              hidden
            />
            
            <button class="primary-button" @click="triggerFileInput">
              <span class="button-icon">📁</span>
              Explorar archivos
            </button>
            
            <div class="file-requirements">
              <p>✅ Archivos .zip hasta 50MB</p>
              <p>✅ Se descomprimirá automáticamente</p>
              <p>✅ Cada archivo tendrá clave única</p>
            </div>
          </div>
        </div>

        <!-- Archivo seleccionado -->
        <div v-if="selectedFile && !isUploading" class="selected-file-card">
          <div class="card-header">
            <h4>📋 Archivo listo para enviar</h4>
            <button class="close-button" @click="clearFile">
              <span class="close-icon">×</span>
            </button>
          </div>
          
          <div class="file-preview">
            <div class="preview-icon">📦</div>
            <div class="preview-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-meta">
                <span class="meta-item">{{ formatFileSize(selectedFile.size) }}</span>
                <span class="meta-item">•</span>
                <span class="meta-item">Tipo: ZIP</span>
              </div>
            </div>
          </div>
          
          <div class="upload-actions">
            <button class="upload-button success" @click="uploadToBackend">
              <span class="button-icon">🚀</span>
              Enviar al Backend
            </button>
            <p class="upload-hint">El backend procesará y descomprimirá el archivo</p>
          </div>
        </div>

        <!-- Progreso de carga -->
        <div v-if="isUploading" class="upload-progress-card">
          <div class="progress-header">
            <h4>⏳ Procesando en el Backend</h4>
            <span class="progress-percent">{{ uploadProgress }}%</span>
          </div>
          
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <div class="progress-labels">
              <span>Enviando archivo...</span>
              <span>{{ uploadProgress }}%</span>
            </div>
          </div>
          
          <div class="backend-status">
            <div class="status-indicator processing"></div>
            <span class="status-message">{{ backendStatus || 'Conectando con el servidor...' }}</span>
          </div>
          
          <div class="progress-stats">
            <div class="stat">
              <span class="stat-value">{{ uploadProgress }}</span>
              <span class="stat-label">Progreso</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatFileSize(selectedFile?.size || 0) }}</span>
              <span class="stat-label">Tamaño</span>
            </div>
            <div class="stat">
              <span class="stat-value">Backend</span>
              <span class="stat-label">Servidor</span>
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div v-if="backendResult" class="result-card success">
          <div class="result-header">
            <div class="result-icon">✅</div>
            <div class="result-title">
              <h4>¡Procesamiento completado!</h4>
              <p>El backend ha terminado de procesar tu archivo</p>
            </div>
          </div>

          <!--  Lista de archivos procesados -->
          <div class="detail-row" v-if="backendResult?.data?.files?.length">
            <span class="detail-label">Archivos procesados:</span>
            <div class="detail-value">
              <ul>
                <li v-for="f in backendResult.data.files" :key="f.id" style="margin-bottom:0.5rem;">
                  {{ f.originalName || f.name }} ({{ formatFileSize(f.size) }})
                  <button 
                    class="primary-button outline" 
                    @click="downloadFile(f)"
                    style="margin-left:1rem;"
                  >
                    Descargar
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="detail-row" v-if="backendResult?.data?.skippedFiles?.length">
            <span class="detail-label">Archivos omitidos:</span>
            <div class="detail-value">
              <ul>
                <li v-for="f in backendResult.data.skippedFiles" :key="f">
                  {{ f }}
                </li>
              </ul>
            </div>
          </div>

          <div class="detail-row" v-if="backendResult?.data?.files">
            <span class="detail-label">Claves de descarga:</span>
            <div class="detail-value">
              <ul>
                <li v-for="f in backendResult.data.files" :key="f.id">
                  {{ f.name }} → {{ f.downloadKey }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="result-actions">
            <button class="secondary-button" @click="clearResult">
              <span class="button-icon">🔄</span>
              Subir otro archivo
            </button>
            <button class="primary-button outline" @click="$emit('view-files')">
              <span class="button-icon">📁</span>
              Ver archivos
            </button>
          </div>
        </div>
      </div>

      <!-- Panel derecho: Información y estadísticas -->
      <div class="info-panel">
        <!-- Tarjeta de estadísticas -->
        <div class="stats-card">
          <div class="stats-header">
            <h4>📊 Estadísticas del Sistema</h4>
            <button class="refresh-stats" @click="loadStats" title="Actualizar estadísticas">
              🔄
            </button>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item" v-for="stat in systemStats" :key="stat.label">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-content">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta de información -->
        <div class="info-card">
          <h4>ℹ️ ¿Cómo funciona?</h4>
          <div class="info-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>Subes el ZIP</strong>
                <p>Arrastra o selecciona tu archivo .zip</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>Backend procesa</strong>
                <p>El servidor descomprime y valida</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>Almacena en Firebase</strong>
                <p>Cada archivo obtiene clave única</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <strong>Listo para descargar</strong>
                <p>Accede con clave desde la lista</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta de requisitos -->
        <div class="requirements-card">
          <h4>📝 Requisitos técnicos</h4>
          <ul class="requirements-list">
            <li class="requirement valid">
              <span class="requirement-icon">✅</span>
              <span class="requirement-text">Archivos .zip (máx. 50MB)</span>
            </li>
            <li class="requirement valid">
              <span class="requirement-icon">✅</span>
              <span class="requirement-text">Sin contraseña en el ZIP</span>
            </li>
            <li class="requirement valid">
              <span class="requirement-icon">✅</span>
              <span class="requirement-text">Máximo 100 archivos por ZIP</span>
            </li>
            <li class="requirement valid">
              <span class="requirement-icon">✅</span>
              <span class="requirement-text">Conexión a internet estable</span>
            </li>
            <li class="requirement valid">
              <span class="requirement-icon">✅</span>
              <span class="requirement-text">Backend activo en puerto 3000</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Notificaciones flotantes -->
    <div v-if="notification.show" :class="['notification', notification.type]">
      <div class="notification-content">
        <span class="notification-icon">{{ getNotificationIcon(notification.type) }}</span>
        <span class="notification-message">{{ notification.message }}</span>
      </div>
      <button class="notification-close" @click="hideNotification">×</button>
    </div>

    <!-- Modal de error -->
    <div v-if="showErrorModal" class="modal-overlay" @click.self="closeErrorModal">
      <div class="error-modal">
        <div class="modal-header error">
          <div class="modal-icon">❌</div>
          <div class="modal-title">
            <h3>Error al procesar</h3>
            <p>Ocurrió un problema con tu archivo</p>
          </div>
          <button class="modal-close" @click="closeErrorModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="error-details">
            <p><strong>Código:</strong> {{ errorData.code || 'UNKNOWN_ERROR' }}</p>
            <p><strong>Mensaje:</strong> {{ errorData.message || 'Error desconocido' }}</p>
            <p><strong>Archivo:</strong> {{ errorData.fileName || selectedFile?.name || 'No especificado' }}</p>
          </div>
          
          <div class="error-solutions">
            <h5>Posibles soluciones:</h5>
            <ul>
              <li>Verifica que el archivo sea un ZIP válido</li>
              <li>Asegúrate de que no supere los 50MB</li>
              <li>Comprueba tu conexión a internet</li>
              <li>Verifica que el backend esté ejecutándose</li>
            </ul>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-button" @click="closeErrorModal">
            Cerrar
          </button>
          <button class="primary-button" @click="retryUpload">
            <span class="button-icon">🔄</span>
            Reintentar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fileAPI } from '@/services/api'

const emit = defineEmits(['file-uploaded', 'view-files'])

// Estado principal
const isDragOver = ref(false)
const selectedFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const backendStatus = ref('')
const backendResult = ref(null)
const fileInput = ref(null)

// Sistema de notificaciones
const notification = ref({
  show: false,
  type: 'info', // 'success', 'error', 'warning', 'info'
  message: ''
})

// Sistema de errores
const showErrorModal = ref(false)
const errorData = ref({})

// Estadísticas del sistema
const systemStats = ref([
  { icon: '📦', label: 'ZIPs procesados', value: '0' },
  { icon: '📁', label: 'Archivos totales', value: '0' },
  { icon: '💾', label: 'Espacio usado', value: '0 MB' },
  { icon: '⬇️', label: 'Descargas totales', value: '0' }
])

// Formatear tamaño de archivo
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Mostrar notificación
const showNotification = (message, type = 'info', duration = 5000) => {
  notification.value = { show: true, message, type }
  
  if (duration > 0) {
    setTimeout(() => {
      notification.value.show = false
    }, duration)
  }
}

const hideNotification = () => {
  notification.value.show = false
}

const getNotificationIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type] || 'ℹ️'
}

const downloadFile = async (file) => {
  try {
    // Usa la clave de descarga que ya tienes en Firestore
    const res = await fileAPI.requestDownload(file.id, file.downloadKey);

    // Crear enlace temporal
    const link = document.createElement('a');
    link.href = res.data.downloadUrl;
    link.download = file.originalName || file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    showNotification(`❌ Error al descargar ${file.name}: ${err.message}`, 'error');
  }
};


// Manejo de errores
const showError = (error) => {
  errorData.value = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Error desconocido',
    fileName: selectedFile.value?.name
  }
  showErrorModal.value = true
  showNotification(error.message || 'Error al procesar archivo', 'error')
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorData.value = {}
}

const retryUpload = () => {
  closeErrorModal()
  if (selectedFile.value) {
    uploadToBackend()
  }
}

// Cargar estadísticas
const loadStats = async () => {
  try {
    const response = await fileAPI.getStats()
    const stats = response.data
    
    systemStats.value = [
      { icon: '📦', label: 'ZIPs procesados', value: Object.keys(stats.zips || {}).length },
      { icon: '📁', label: 'Archivos totales', value: stats.totalFiles || 0 },
      { icon: '💾', label: 'Espacio usado', value: stats.formattedSize || '0 MB' },
      { icon: '⬇️', label: 'Descargas totales', value: stats.totalDownloads || 0 }
    ]
    
    showNotification('Estadísticas actualizadas', 'success', 2000)
  } catch (error) {
    console.error('Error cargando estadísticas:', error)
  }
}

// Funciones de arrastrar y soltar
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  
  if (file && validateFile(file)) {
    selectedFile.value = file
    showNotification('Archivo listo para enviar', 'success', 3000)
  }
}

// Validar archivo
const validateFile = (file) => {
  // Verificar que sea ZIP
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showError({ 
      code: 'INVALID_TYPE', 
      message: 'Solo se permiten archivos ZIP (.zip)' 
    })
    return false
  }
  
  // Verificar tamaño (50MB máximo)
  if (file.size > 50 * 1024 * 1024) {
    showError({ 
      code: 'FILE_TOO_LARGE', 
      message: 'El archivo es demasiado grande. Máximo 50MB.' 
    })
    return false
  }
  
  return true
}

// Trigger file input
const triggerFileInput = () => {
  fileInput.value.click()
}

// Manejar selección de archivo
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    showNotification('Archivo seleccionado correctamente', 'success', 3000)
  }
}

// Limpiar archivo
const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Limpiar resultado
const clearResult = () => {
  backendResult.value = null
  clearFile()
  showNotification('Listo para subir nuevo archivo', 'info', 2000)
}

// Subir al backend
const uploadToBackend = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  backendStatus.value = 'Preparando envío...'
  backendResult.value = null
  
  try {
    // Simular progreso inicial
    for (let i = 0; i < 30; i++) {
      uploadProgress.value = i
      backendStatus.value = `Validando archivo... ${i}%`
      await new Promise(resolve => setTimeout(resolve, 30))
    }
    
    // Llamar al API real del backend
    backendStatus.value = 'Enviando al servidor...'
    
    // Configurar callback de progreso (simulado para demo)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 5
        backendStatus.value = `Procesando... ${uploadProgress.value}%`
      }
    }, 200)
    
    // Llamada real al backend
    const result = await fileAPI.uploadZip(selectedFile.value)
    
    // Completar progreso
    clearInterval(progressInterval)
    uploadProgress.value = 100
    backendStatus.value = 'Completando...'
    
    // Esperar un momento para mostrar el 100%
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Guardar resultado
    backendResult.value = result
    isUploading.value = false
    backendStatus.value = ''
    
    // Mostrar notificación de éxito
    showNotification(
      `¡Éxito! ${result.data.uploadedFiles} archivos procesados`,
      'success',
      5000
    )
    
    // Emitir evento al componente padre con claves incluidas
    emit('file-uploaded', {
      zipName: result.data.zipName,
      fileCount: result.data.uploadedFiles,
      totalFiles: result.data.totalFiles,
      totalSize: result.data.totalSize,
      files: result.data.files // 🔑 incluye downloadKey
    })
    
    // Actualizar estadísticas
    loadStats()
    
  } catch (error) {
    console.error('Error al subir al backend:', error)
    isUploading.value = false
    backendStatus.value = ''
    
    // Mostrar error específico
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
      showError({ 
        code: 'NETWORK_ERROR', 
        message: 'No se pudo conectar con el servidor backend. Asegúrate de que esté ejecutándose en puerto 3000.' 
      })
    } else if (error.code === 'FILE_TOO_LARGE') {
      showError(error)
    } else {
      showError({ 
        code: 'SERVER_ERROR', 
        message: error.message || 'Error del servidor al procesar el archivo' 
      })
    }
  }
}

// Inicializar
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* ===== ESTILOS PRINCIPALES ===== */
.enhanced-file-upload {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1929 0%, #0d1b2a 100%);
  color: white;
  padding: 2rem;
}

/* ===== ENCABEZADO ===== */
.upload-header-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(0, 180, 216, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 4rem;
  color: #00b4d8;
}

.main-title {
  font-size: 2.8rem;
  font-weight: 900;
  color: #00b4d8;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 1.1rem;
  color: #90e0ef;
  margin: 0.5rem 0 1.5rem;
  max-width: 600px;
}

.tech-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.badge {
  background: rgba(0, 180, 216, 0.2);
  color: #00b4d8;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid rgba(0, 180, 216, 0.4);
}

/* ===== LAYOUT PRINCIPAL ===== */
.upload-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .upload-layout {
    grid-template-columns: 1fr;
  }
}

/* ===== PANEL DE SUBIDA ===== */
.upload-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Área de arrastrar y soltar */
.drag-drop-area {
  border: 3px dashed rgba(0, 180, 216, 0.5);
  border-radius: 15px;
  padding: 4rem 2rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
}

.drag-drop-area.drag-over {
  border-color: #00b4d8;
  background: rgba(0, 180, 216, 0.1);
  transform: scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 180, 216, 0.2);
}

.drag-icon {
  margin-bottom: 1.5rem;
}

.icon-circle {
  width: 100px;
  height: 100px;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  margin: 0 auto;
  border: 3px dashed rgba(0, 180, 216, 0.3);
  transition: all 0.3s;
}

.drag-drop-area:hover .icon-circle {
  transform: rotate(10deg);
  border-color: #00b4d8;
}

.drag-content h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.drag-subtitle {
  color: #90e0ef;
  margin-bottom: 2rem;
}

.file-requirements {
  margin-top: 2rem;
  color: #90e0ef;
  font-size: 0.9rem;
}

.file-requirements p {
  margin: 0.3rem 0;
}

/* Tarjeta de archivo seleccionado */
.selected-file-card {
  background: rgba(0, 180, 216, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(0, 180, 216, 0.3);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: rgba(0, 180, 216, 0.15);
  border-bottom: 1px solid rgba(0, 180, 216, 0.2);
}

.card-header h4 {
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.close-button:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

.close-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.preview-icon {
  font-size: 3rem;
  color: #00b4d8;
}

.preview-details {
  flex: 1;
}

.file-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
  word-break: break-all;
}

.file-meta {
  color: #90e0ef;
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
}

.upload-actions {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.upload-hint {
  color: #90e0ef;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}

/* Tarjeta de progreso */
.upload-progress-card {
  background: rgba(0, 180, 216, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(0, 180, 216, 0.3);
  padding: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.progress-header h4 {
  color: white;
  margin: 0;
}

.progress-percent {
  font-size: 1.8rem;
  font-weight: bold;
  color: #00b4d8;
}

.progress-container {
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00b4d8, #0097a7);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  color: #90e0ef;
  font-size: 0.9rem;
}

.backend-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.processing {
  background: #00b4d8;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-message {
  color: #90e0ef;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #00b4d8;
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #90e0ef;
}

/* Tarjeta de resultado */
.result-card {
  border-radius: 15px;
  overflow: hidden;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card.success {
  background: rgba(0, 184, 148, 0.1);
  border: 1px solid rgba(0, 184, 148, 0.3);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 184, 148, 0.15);
}

.result-icon {
  font-size: 2.5rem;
}

.result-title h4 {
  color: white;
  margin: 0 0 0.3rem 0;
}

.result-title p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 0.9rem;
}

.result-details {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-label {
  color: #90e0ef;
}

.detail-value {
  color: white;
  font-weight: 500;
}

.result-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ===== PANEL DE INFORMACIÓN ===== */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Tarjeta de estadísticas */
.stats-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stats-header h4 {
  color: white;
  margin: 0;
}

.refresh-stats {
  background: rgba(0, 180, 216, 0.1);
  border: 1px solid rgba(0, 180, 216, 0.3);
  color: #00b4d8;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-stats:hover {
  background: rgba(0, 180, 216, 0.2);
  transform: rotate(180deg);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  transition: transform 0.3s;
}

.stat-item:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.05);
}

.stat-icon {
  font-size: 1.8rem;
  color: #00b4d8;
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.2rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #90e0ef;
}

/* Tarjeta de información */
.info-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.info-card h4 {
  color: white;
  margin: 0 0 1.5rem 0;
}

.info-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(45deg, #0077b6, #0096c7);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  color: white;
  display: block;
  margin-bottom: 0.2rem;
}

.step-content p {
  color: #90e0ef;
  font-size: 0.9rem;
  margin: 0;
}

/* Tarjeta de requisitos */
.requirements-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.requirements-card h4 {
  color: white;
  margin: 0 0 1.5rem 0;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  border-radius: 8px;
  transition: background 0.3s;
}

.requirement:hover {
  background: rgba(255, 255, 255, 0.03);
}

.requirement:last-child {
  margin-bottom: 0;
}

.requirement-icon {
  font-size: 1.2rem;
}

.requirement.valid .requirement-icon {
  color: #00b894;
}

.requirement-text {
  color: #90e0ef;
  font-size: 0.9rem;
}

/* ===== BOTONES ===== */
.primary-button {
  background: linear-gradient(45deg, #0077b6, #0096c7);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 200px;
  margin: 0 auto;
}

.primary-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #0096c7, #00b4d8);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 180, 216, 0.3);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button.outline {
  background: transparent;
  border: 2px solid #00b4d8;
  color: #00b4d8;
}

.primary-button.outline:hover {
  background: rgba(0, 180, 216, 0.1);
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.upload-button {
  background: linear-gradient(45deg, #00b894, #00a085);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.upload-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #00a085, #008b74);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 168, 148, 0.3);
}

.button-icon {
  font-size: 1.2rem;
}

/* ===== NOTIFICACIONES ===== */
.notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  max-width: 400px;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  animation: slideInRight 0.3s ease;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: linear-gradient(45deg, #00b894, #00a085);
  border-left: 5px solid #00ffcc;
}

.notification.error {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  border-left: 5px solid #ff7675;
}

.notification.warning {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  border-left: 5px solid #feca57;
}

.notification.info {
  background: linear-gradient(45deg, #3498db, #2980b9);
  border-left: 5px solid #74b9ff;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.notification-icon {
  font-size: 1.5rem;
}

.notification-message {
  color: white;
  flex: 1;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.2rem;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* ===== MODAL DE ERROR ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.error-modal {
  background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  border: 2px solid #e74c3c;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.modal-header.error {
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.05));
  border-bottom: 1px solid rgba(231, 76, 60, 0.3);
}

.modal-icon {
  font-size: 2.5rem;
}

.modal-title h3 {
  color: white;
  margin: 0 0 0.3rem 0;
}

.modal-title p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 0.9rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.3s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
}

.error-details {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error-details p {
  margin: 0.5rem 0;
  color: #90e0ef;
}

.error-details strong {
  color: white;
}

.error-solutions {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error-solutions h5 {
  color: white;
  margin: 0 0 0.8rem 0;
}

.error-solutions ul {
  color: #90e0ef;
  margin: 0;
  padding-left: 1.2rem;
}

.error-solutions li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.error-solutions li:last-child {
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .enhanced-file-upload {
    padding: 1rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .upload-layout {
    gap: 1.5rem;
  }
  
  .upload-panel, .info-panel {
    padding: 1.5rem;
  }
  
  .drag-drop-area {
    padding: 3rem 1.5rem;
  }
  
  .result-actions, .modal-footer {
    flex-direction: column;
  }
  
  .notification {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    max-width: none;
  }
  
  .progress-stats {
    grid-template-columns: 1fr;
  }
}
</style>