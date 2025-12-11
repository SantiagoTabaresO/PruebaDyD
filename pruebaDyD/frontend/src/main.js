import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Importar Firebase (opcional, para verificar conexión)
import { app } from './firebase.js'

// Crear la aplicación Vue
const vueApp = createApp(App)

// Usar Pinia para estado global
const pinia = createPinia()
vueApp.use(pinia)

// Usar Router
vueApp.use(router)

// Montar la aplicación
vueApp.mount('#app')

// Log para verificar Firebase
console.log('Firebase app inicializada:', app.name)