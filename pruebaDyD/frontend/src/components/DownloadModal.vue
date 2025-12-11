<template>
  <div class="download-modal">
    <div class="modal-overlay" @click="$emit('cancel')"></div>
    
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-icon">🔒</div>
        <div class="header-text">
          <h3>DESCARGAR ARCHIVO</h3>
          <p class="header-subtitle">Validación por clave de seguridad</p>
        </div>
        <button class="close-btn" @click="$emit('cancel')" title="Cerrar">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Previsualización del archivo -->
        <div class="file-preview">
          <div class="preview-icon">
            {{ getFileIcon(file.name) }}
          </div>
          <div class="preview-details">
            <h4 class="preview-title">{{ file.originalName || file.name }}</h4>
            <div class="preview-meta">
              <span class="meta-item">
                <span class="meta-label">Tamaño:</span>
                <span class="meta-value">{{ formatFileSize(file.size) }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">ZIP origen:</span>
                <span class="meta-value">{{ file.parentZip }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">Subido:</span>
                <span class="meta-value">{{ formatDate(file.uploadedAt) }}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Validación de clave -->
        <div class="key-validation">
          <div class="key-header">
            <h4>Validación de Seguridad</h4>
            <span class="key-hint" @click="showKeyHint = !showKeyHint" title="Mostrar ayuda">?</span>
          </div>
          
          <div v-if="showKeyHint" class="key-hint-content">
            <p>La clave de seguridad fue generada automáticamente cuando se descomprimió el archivo.</p>
            <p>Se almacena en la base de datos junto con la información del archivo.</p>
          </div>
          
          <div class="key-input-group">
            <label for="downloadKey">
              <span class="label-icon">🔑</span>
              Ingresa la clave de descarga:
            </label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="downloadKey"
                v-model="inputKey"
                placeholder="Ej: AbCdEfG123!@#"
                @keyup.enter="validateKey"
                class="key-input"
                :disabled="loading"
              />
              <button 
                class="show-key-btn"
                @click="toggleKeyVisibility"
                :title="showPassword ? 'Ocultar clave' : 'Mostrar clave'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="key-strength" :class="getKeyStrength(inputKey)">
              Seguridad: {{ getKeyStrengthText(inputKey) }}
            </div>
          </div>
          
          <!-- Intentos restantes -->
          <div v-if="attemptsRemaining < 3" class="attempts-warning">
            <span class="warning-icon">⚠️</span>
            Intentos restantes: {{ attemptsRemaining }}
          </div>
          
          <!-- Mensajes de estado -->
          <div v-if="message" :class="['message', messageType]">
            <span class="message-icon">{{ getMessageIcon(messageType) }}</span>
            {{ message }}
          </div>
          
          <!-- Botones de acción -->
          <div class="modal-actions">
            <button class="btn-secondary" @click="$emit('cancel')" :disabled="loading">
              Cancelar
            </button>
            <button class="btn-primary" @click="validateKey" :disabled="!inputKey || loading">
              <span v-if="!loading">
                <span class="btn-icon">⬇️</span>
                Validar y Descargar
              </span>
              <span v-else>
                <span class="spinner-small"></span>
                Validando...
              </span>
            </button>
          </div>
          
          <!-- Información adicional -->
          <div class="additional-info">
            <details>
              <summary>📋 Información técnica del archivo</summary>
              <div class="tech-details">
                <div class="tech-row">
                  <span class="tech-label">ID en Firestore:</span>
                  <span class="tech-value">{{ file.id }}</span>
                </div>
                <div class="tech-row">
                  <span class="tech-label">Ruta en Storage:</span>
                  <span class="tech-value">{{ file.path }}</span>
                </div>
                <div class="tech-row">
                  <span class="tech-label">Tipo MIME:</span>
                  <span class="tech-value">{{ file.contentType || 'Desconocido' }}</span>
                </div>
                <div class="tech-row">
                  <span class="tech-label">Clave almacenada:</span>
                  <span class="tech-value key-preview">{{ file.downloadKey ? '••••••••' : 'No disponible' }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// Estado
const inputKey = ref('')
const showPassword = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const showKeyHint = ref(false)
const attemptsRemaining = ref(3)

// Funciones auxiliares
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  const icons = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
    xls: '📊', xlsx: '📊', jpg: '🖼️', png: '🖼️',
    zip: '📦', rar: '📦', js: '📜', html: '🌐',
    css: '🎨', json: '🔧', xml: '🔧', csv: '📊'
  }
  return icons[ext] || '📁'
}

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Fecha inválida'
  }
}

const toggleKeyVisibility = () => {
  showPassword.value = !showPassword.value
  const input = document.getElementById('downloadKey')
  if (input) {
    input.type = showPassword.value ? 'text' : 'password'
  }
}

const getKeyStrength = (key) => {
  if (!key) return 'empty'
  if (key.length < 8) return 'weak'
  if (key.length < 12) return 'medium'
  
  // Verificar complejidad
  const hasUpper = /[A-Z]/.test(key)
  const hasLower = /[a-z]/.test(key)
  const hasNumbers = /\d/.test(key)
  const hasSpecial = /[^A-Za-z0-9]/.test(key)
  
  const complexity = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length
  
  if (complexity >= 3 && key.length >= 16) return 'strong'
  if (complexity >= 2) return 'medium'
  return 'weak'
}

const getKeyStrengthText = (key) => {
  const strength = getKeyStrength(key)
  const texts = {
    empty: 'No ingresada',
    weak: 'Débil',
    medium: 'Media',
    strong: 'Fuerte'
  }
  return texts[strength]
}

const getMessageIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type] || 'ℹ️'
}

// Validar clave y descargar
const validateKey = async () => {
  if (!inputKey.value) {
    message.value = 'Por favor ingresa la clave de descarga'
    messageType.value = 'warning'
    return
  }

  loading.value = true
  message.value = ''
  messageType.value = 'info'

  try {
    // Simular validación (en un caso real, esto sería con el backend)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validar clave (comparar con la almacenada)
    if (inputKey.value === props.file.downloadKey) {
      // Clave válida - proceder con descarga
      message.value = '✅ Clave válida. Iniciando descarga...'
      messageType.value = 'success'
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = props.file.downloadURL
      link.download = props.file.originalName || props.file.name
      link.target = '_blank'
      
      // Añadir al documento y hacer clic
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Emitir evento de confirmación
      emit('confirm', inputKey.value)
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        emit('cancel')
      }, 2000)
      
    } else {
      // Clave incorrecta
      attemptsRemaining.value--
      
      if (attemptsRemaining.value <= 0) {
        message.value = '❌ Demasiados intentos fallidos. Intenta más tarde.'
        messageType.value = 'error'
        setTimeout(() => {
          emit('cancel')
        }, 3000)
      } else {
        message.value = `❌ Clave incorrecta. Te quedan ${attemptsRemaining.value} intentos.`
        messageType.value = 'error'
        
        // Limpiar campo después de error
        setTimeout(() => {
          inputKey.value = ''
          showPassword.value = false
          const input = document.getElementById('downloadKey')
          if (input) input.type = 'password'
        }, 1000)
      }
    }
    
  } catch (error) {
    console.error('Error en la descarga:', error)
    message.value = `❌ Error: ${error.message}`
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.download-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  border: 2px solid #00b4d8;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  animation: modalAppear 0.3s ease;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  padding: 1.5rem;
  background: linear-gradient(90deg, rgba(0, 180, 216, 0.1), rgba(0, 180, 216, 0.05));
  border-bottom: 1px solid rgba(0, 180, 216, 0.3);
  gap: 1rem;
}

.header-icon {
  font-size: 2rem;
  color: #00b4d8;
}

.header-text {
  flex: 1;
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.header-subtitle {
  color: #90e0ef;
  font-size: 0.8rem;
  margin-top: 0.2rem;
  opacity: 0.8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #90e0ef;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 216, 0.2);
  margin-bottom: 1.5rem;
}

.preview-icon {
  font-size: 3rem;
  color: #00b4d8;
  min-width: 60px;
  text-align: center;
}

.preview-details {
  flex: 1;
  min-width: 0;
}

.preview-title {
  color: white;
  font-weight: bold;
  margin-bottom: 0.5rem;
  word-break: break-all;
  font-size: 1rem;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-label {
  color: #90e0ef;
  min-width: 70px;
}

.meta-value {
  color: white;
  word-break: break-all;
}

.key-validation {
  margin-top: 1.5rem;
}

.key-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.key-header h4 {
  color: white;
  margin: 0;
  font-size: 1.1rem;
}

.key-hint {
  color: #00b4d8;
  background: rgba(0, 180, 216, 0.1);
  border: 1px solid rgba(0, 180, 216, 0.3);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: help;
  transition: all 0.3s;
}

.key-hint:hover {
  background: rgba(0, 180, 216, 0.2);
  transform: scale(1.1);
}

.key-hint-content {
  background: rgba(0, 180, 216, 0.05);
  border: 1px solid rgba(0, 180, 216, 0.2);
  border-radius: 8px;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #90e0ef;
}

.key-hint-content p {
  margin: 0.3rem 0;
}

.key-input-group {
  margin-bottom: 1.5rem;
}

.key-input-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.label-icon {
  color: #00b4d8;
}

.input-wrapper {
  position: relative;
  margin-bottom: 0.5rem;
}

.key-input {
  width: 100%;
  padding: 0.8rem 3rem 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.07);
  border: 2px solid rgba(0, 180, 216, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: 'Courier New', monospace;
}

.key-input:focus {
  outline: none;
  border-color: #00b4d8;
  background: rgba(0, 180, 216, 0.05);
  box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.2);
}

.key-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.show-key-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #90e0ef;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem;
  transition: all 0.3s;
}

.show-key-btn:hover {
  color: #00b4d8;
  transform: translateY(-50%) scale(1.1);
}

.key-strength {
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.key-strength.empty {
  color: #90e0ef;
  background: rgba(144, 224, 239, 0.1);
}

.key-strength.weak {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.key-strength.medium {
  color: #feca57;
  background: rgba(254, 202, 87, 0.1);
}

.key-strength.strong {
  color: #00b894;
  background: rgba(0, 184, 148, 0.1);
}

.attempts-warning {
  background: rgba(254, 202, 87, 0.1);
  border: 1px solid rgba(254, 202, 87, 0.3);
  border-radius: 8px;
  padding: 0.8rem;
  color: #feca57;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.warning-icon {
  font-size: 1.2rem;
}

.message {
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: messageAppear 0.3s ease;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.success {
  background: rgba(0, 184, 148, 0.1);
  border: 1px solid rgba(0, 184, 148, 0.3);
  color: #00b894;
}

.message.error {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
}

.message.warning {
  background: rgba(254, 202, 87, 0.1);
  border: 1px solid rgba(254, 202, 87, 0.3);
  color: #feca57;
}

.message.info {
  background: rgba(0, 180, 216, 0.1);
  border: 1px solid rgba(0, 180, 216, 0.3);
  color: #00b4d8;
}

.message-icon {
  font-size: 1.2rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(45deg, #00b4d8, #0097a7);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(45deg, #0097a7, #006978);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 180, 216, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #90e0ef;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.1rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.additional-info {
  margin-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

.additional-info summary {
  color: #90e0ef;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 5px;
  transition: all 0.3s;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.additional-info summary::-webkit-details-marker {
  display: none;
}

.additional-info summary:before {
  content: '▶';
  display: inline-block;
  transition: transform 0.3s;
}

.additional-info details[open] summary:before {
  transform: rotate(90deg);
}

.additional-info summary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.tech-details {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tech-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.tech-row:last-child {
  margin-bottom: 0;
}

.tech-label {
  color: #90e0ef;
  min-width: 120px;
}

.tech-value {
  color: white;
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

.key-preview {
  letter-spacing: 2px;
  color: #feca57;
}

@media (max-width: 768px) {
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .file-preview {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .preview-meta {
    align-items: center;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .tech-row {
    flex-direction: column;
    gap: 0.2rem;
  }
  
  .tech-label {
    min-width: auto;
  }
}
</style>