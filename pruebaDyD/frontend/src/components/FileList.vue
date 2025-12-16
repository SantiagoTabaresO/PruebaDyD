<template>
  <div class="file-list">
    <div class="list-header">
      <div class="header-left">
        <h3>📁 ARCHIVOS PROCESADOS POR EL BACKEND</h3>
        <p class="list-subtitle">Los archivos se descomprimen en el servidor</p>
      </div>
      
      <div class="header-actions">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Buscar archivos..."
            class="search-input"
            @input="debouncedSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <button class="refresh-btn" @click="loadFilesFromBackend" :disabled="loading">
          <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>
    
    <!-- Estadísticas del backend -->
    <div v-if="backendStats" class="backend-stats">
      <div class="stat-item">
        <span class="stat-number">{{ backendStats.totalFiles }}</span>
        <span class="stat-label">Archivos totales</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ backendStats.formattedSize }}</span>
        <span class="stat-label">Espacio usado</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ backendStats.totalDownloads }}</span>
        <span class="stat-label">Descargas</span>
      </div>
    </div>
    
    <!-- Estados -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando desde el backend...</p>
    </div>
    
    <div v-else-if="files.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p class="empty-title">No hay archivos procesados</p>
      <p class="empty-subtitle">Sube un archivo ZIP para comenzar</p>
    </div>
    
    <!-- Lista de archivos -->
    <div v-else class="files-container">
      <div class="file-group" v-for="group in groupedFiles" :key="group.zipName">
        <div class="group-header" @click="toggleGroup(group.zipName)">
          <div class="group-info">
            <span class="group-icon">📦</span>
            <span class="group-name">{{ group.zipName }}</span>
            <span class="group-count">{{ group.files.length }} archivos</span>
            <span class="group-size">{{ formatFileSize(group.totalSize) }}</span>
          </div>
          <span class="group-toggle">
            {{ expandedGroups[group.zipName] ? '▼' : '▶' }}
          </span>
        </div>
        
        <div v-if="expandedGroups[group.zipName]" class="group-files">
          <div 
            v-for="file in group.files" 
            :key="file.id"
            class="file-item"
          >
            <div class="file-icon">
              {{ getFileIcon(file.name) }}
            </div>
            
            <div class="file-info">
              <span class="file-name">{{ file.originalName || file.name }}</span>
              <span class="file-path">{{ file.name }}</span>
              <span class="file-meta">
                {{ formatFileSize(file.size) }} • 
                {{ formatDate(file.uploadedAt) }} • 
                Descargas: {{ file.downloadCount || 0 }}
              </span>
            </div>
            
            <div class="file-actions">
              <button 
                class="download-btn" 
                @click="requestDownload(file)"
                :title="`Descargar ${file.originalName || file.name}`"
              >
                <span class="btn-icon">⬇️</span>
                <span class="btn-text">Descargar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de descarga -->
    <div v-if="showDownloadModal" class="download-modal-overlay" @click.self="closeDownloadModal">
      <div class="download-modal">
        <div class="modal-header">
          <h4>🔒 Descargar Archivo</h4>
          <button class="close-btn" @click="closeDownloadModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="file-info">
            <div class="file-icon-large">{{ getFileIcon(selectedFile?.name) }}</div>
            <div>
              <p class="file-name-large">{{ selectedFile?.originalName || selectedFile?.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile?.size) }}</p>
            </div>
          </div>
          
          <div class="key-input">
            <label for="downloadKey">Clave de descarga:</label>
            <input 
              type="password" 
              v-model="downloadKey"
              placeholder="Ingresa la clave proporcionada"
              class="key-field"
              @keyup.enter="validateDownloadKey"
            />
            <p class="key-hint">La clave se genera automáticamente al procesar el ZIP</p>
          </div>
          
          <div v-if="downloadError" class="error-message">
            ❌ {{ downloadError }}
          </div>
          
          <div class="modal-actions">
            <button class="btn-cancel" @click="closeDownloadModal">Cancelar</button>
            <button 
              class="btn-download" 
              @click="validateDownloadKey"
              :disabled="!downloadKey || validating"
            >
              {{ validating ? 'Validando...' : 'Descargar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { fileAPI } from '@/services/api'
import debounce from 'lodash/debounce'

const emit = defineEmits(['refresh'])

// Estado
const files = ref([])
const backendStats = ref(null)
const loading = ref(false)
const searchQuery = ref('')
const expandedGroups = ref({})
const showDownloadModal = ref(false)
const selectedFile = ref(null)
const downloadKey = ref('')
const downloadError = ref('')
const validating = ref(false)

// Cargar archivos desde el backend
const loadFilesFromBackend = async () => {
  loading.value = true
  try {
    const response = await fileAPI.listFiles({
      search: searchQuery.value || undefined
    })

    // ✅ ESTO ES LO CORRECTO CON TU BACKEND
    files.value = response.data.data.files || []

    const statsResponse = await fileAPI.getStats()
    backendStats.value = statsResponse.data

    // Expandir primer grupo
    if (groupedFiles.value.length > 0 && !expandedGroups.value[groupedFiles.value[0].zipName]) {
      expandedGroups.value[groupedFiles.value[0].zipName] = true
    }

    emit('refresh')
  } catch (error) {
    console.error('Error cargando archivos:', error)
    files.value = []
  } finally {
    loading.value = false
  }
}


// Búsqueda con debounce
const debouncedSearch = debounce(() => {
  loadFilesFromBackend()
}, 500)

// Agrupar archivos
const groupedFiles = computed(() => {
  const groups = {}
  
  files.value.forEach(file => {
    const zipName = file.parentZip || 'Sin categoría'
    
    if (!groups[zipName]) {
      groups[zipName] = {
        zipName,
        files: [],
        totalSize: 0
      }
    }
    
    groups[zipName].files.push(file)
    groups[zipName].totalSize += file.size || 0
  })
  
  return Object.values(groups).sort((a, b) => b.files.length - a.files.length)
})

// Funciones auxiliares
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Fecha desconocida'
  
  try {
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    return 'Fecha inválida'
  }
}

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop().toLowerCase() || ''
  const icons = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
    xls: '📊', xlsx: '📊', jpg: '🖼️', png: '🖼️',
    zip: '📦', rar: '📦', js: '📜', html: '🌐'
  }
  return icons[ext] || '📁'
}

const toggleGroup = (zipName) => {
  expandedGroups.value[zipName] = !expandedGroups.value[zipName]
}

// Descarga
const requestDownload = (file) => {
  selectedFile.value = file
  downloadKey.value = file.downloadKey || ''
  downloadError.value = ''
  showDownloadModal.value = true
}


const closeDownloadModal = () => {
  showDownloadModal.value = false
  selectedFile.value = null
  downloadKey.value = ''
  downloadError.value = ''
  validating.value = false
}

const validateDownloadKey = async () => {
  if (!selectedFile.value || !downloadKey.value) return
  
  validating.value = true
  downloadError.value = ''
  
  try {
    const response = await fileAPI.requestDownload(
      selectedFile.value.id,
      downloadKey.value
    )
    
    // Descargar archivo
    const link = document.createElement('a')
    link.href = response.data.downloadUrl
    link.download = selectedFile.value.originalName || selectedFile.value.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cerrar modal y actualizar lista
    closeDownloadModal()
    loadFilesFromBackend()
    
  } catch (error) {
    downloadError.value = error.message || 'Error al validar la clave'
  } finally {
    validating.value = false
  }
}

// Inicializar
onMounted(() => {
  loadFilesFromBackend()
})

// Watch para búsqueda
watch(searchQuery, () => {
  debouncedSearch()
})
</script>

<style scoped>
.backend-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(0, 180, 216, 0.3);
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #00b4d8;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #90e0ef;
}

.download-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.download-modal {
  background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  border: 2px solid #00b4d8;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  background: rgba(0, 180, 216, 0.1);
  border-bottom: 1px solid rgba(0, 180, 216, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  color: #00b4d8;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #90e0ef;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.file-icon-large {
  font-size: 3rem;
}

.file-name-large {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: white;
}

.key-input {
  margin-bottom: 20px;
}

.key-input label {
  display: block;
  margin-bottom: 8px;
  color: #90e0ef;
  font-weight: 500;
}

.key-field {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.07);
  border: 2px solid rgba(0, 180, 216, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.key-field:focus {
  outline: none;
  border-color: #00b4d8;
}

.key-hint {
  font-size: 0.8rem;
  color: #90e0ef;
  margin-top: 5px;
  opacity: 0.8;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #90e0ef;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-download {
  background: linear-gradient(45deg, #00b4d8, #0097a7);
  color: white;
}

.btn-download:hover:not(:disabled) {
  background: linear-gradient(45deg, #0097a7, #006978);
}

.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 10px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 5px;
  color: #ff6b6b;
  margin-bottom: 15px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>