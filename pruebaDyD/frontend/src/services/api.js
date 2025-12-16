import axios from 'axios';

//const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


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
    console.error(' Backend error full:', error.response?.data);

    if (error.response) {
      throw {
        code: error.response.data?.error?.code || 'SERVER_ERROR',
        message: error.response.data?.error?.message 
          || error.response.data?.message 
          || JSON.stringify(error.response.data),
        status: error.response.status
      };
    }

    throw {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor'
    };
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
    return axios.post(
      `${API_BASE_URL}/files/download`,
      { fileId, downloadKey },
      {
        responseType: 'blob' // 🔑 CLAVE ABSOLUTA
      }
    );
  },

  
  // Obtener estadísticas
  getStats: () => {
    return api.get('/files/stats');
  }
};

export default api;