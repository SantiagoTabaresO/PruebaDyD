import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      // Error del servidor
      const serverError = error.response.data?.error || {};
      throw {
        code: serverError.code || 'UNKNOWN_ERROR',
        message: serverError.message || 'Error del servidor',
        status: error.response.status
      };
    } else if (error.request) {
      // Error de red
      throw {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión con el servidor'
      };
    } else {
      // Error de configuración
      throw {
        code: 'REQUEST_ERROR',
        message: error.message
      };
    }
  }
);

export const fileAPI = {
  // Subir archivo ZIP
  uploadZip: (file, onProgress) => {
    const formData = new FormData();
    formData.append('zipFile', file);
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  // Listar archivos
  listFiles: (params = {}) => {
    return api.get('/files/list', { params });
  },
  
  // Solicitar descarga
  requestDownload: (fileId, downloadKey) => {
    return api.post('/files/download', { fileId, downloadKey });
  },
  
  // Obtener estadísticas
  getStats: () => {
    return api.get('/files/stats');
  }
};

export default api;