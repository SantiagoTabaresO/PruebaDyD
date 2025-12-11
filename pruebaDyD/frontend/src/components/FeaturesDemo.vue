<template>
  <div class="features-container">
    <div class="header-section">
      <h1 class="main-title">DEMOSTRACIÓN VUE.JS</h1>
      <p class="subtitle">4 Características Principales - Interactivo y Responsivo</p>
    </div>

    <div class="features-grid">
      <!-- Característica 1: Reactividad -->
      <div class="feature-card" @mouseenter="activeFeature = 1" @mouseleave="activeFeature = 0">
        <div class="card-icon">⚡</div>
        <h3 class="card-title">REACTIVIDAD</h3>
        
        <div class="demo-content">
          <input 
            v-model="reactiveMessage" 
            placeholder="Escribe algo aquí..."
            class="demo-input"
          />
          <p class="demo-output">Texto reactivo: <strong>{{ reactiveMessage || '...' }}</strong></p>
        </div>
        
        <div class="code-preview">
          <code>&lt;input v-model="mensaje" /&gt;</code>
        </div>
        
        <div class="feature-description" :class="{ active: activeFeature === 1 }">
          <p>La reactividad en Vue permite que la interfaz se actualice automáticamente cuando los datos cambian. Usando <strong>v-model</strong>, se crea un enlace bidireccional entre el input y la variable.</p>
        </div>
      </div>

      <!-- Característica 2: Directivas -->
      <div class="feature-card" @mouseenter="activeFeature = 2" @mouseleave="activeFeature = 0">
        <div class="card-icon">🎯</div>
        <h3 class="card-title">DIRECTIVAS</h3>
        
        <div class="demo-content">
          <button @click="toggleVisibility" class="demo-button">
            {{ isVisible ? 'Ocultar' : 'Mostrar' }} Elementos
          </button>
          
          <div v-if="isVisible" class="items-container">
            <div v-for="(item, index) in items" :key="index" class="item">
              {{ item }}
            </div>
          </div>
        </div>
        
        <div class="code-preview">
          <code>&lt;div v-if="visible"&gt; ... &lt;/div&gt;</code>
        </div>
        
        <div class="feature-description" :class="{ active: activeFeature === 2 }">
          <p>Las directivas como <strong>v-if</strong>, <strong>v-for</strong> y <strong>v-bind</strong> permiten manipular el DOM de forma declarativa. <strong>v-if</strong> muestra/oculta elementos, <strong>v-for</strong> itera arrays.</p>
        </div>
      </div>

      <!-- Característica 3: Computed Properties -->
      <div class="feature-card" @mouseenter="activeFeature = 3" @mouseleave="activeFeature = 0">
        <div class="card-icon">🧮</div>
        <h3 class="card-title">PROPIEDADES COMPUTADAS</h3>
        
        <div class="demo-content">
          <div class="input-group">
            <input 
              v-model.number="price" 
              type="range" 
              min="0" 
              max="1000" 
              step="10"
              class="price-slider"
            />
            <span class="price-value">${{ price }}</span>
          </div>
          
          <div class="calculation">
            <div class="calc-line">
              <span>Precio Base:</span>
              <span>${{ price }}</span>
            </div>
            <div class="calc-line">
              <span>IVA (19%):</span>
              <span>${{ iva }}</span>
            </div>
            <div class="calc-line total">
              <span>TOTAL:</span>
              <span>${{ totalPrice }}</span>
            </div>
          </div>
        </div>
        
        <div class="code-preview">
          <code>computed: { total() { return precio * 1.19 } }</code>
        </div>
        
        <div class="feature-description" :class="{ active: activeFeature === 3 }">
          <p>Las propiedades computadas calculan valores basados en datos reactivos y se cachean automáticamente. Solo se recalculan cuando sus dependencias cambian, mejorando el rendimiento.</p>
        </div>
      </div>

      <!-- Característica 4: Componentes -->
      <div class="feature-card" @mouseenter="activeFeature = 4" @mouseleave="activeFeature = 0">
        <div class="card-icon">🧩</div>
        <h3 class="card-title">COMPONENTES</h3>
        
        <div class="demo-content">
          <div class="counter-widget">
            <button @click="decrement" class="counter-btn">−</button>
            <div class="counter-display">
              <span class="counter-value">{{ counter }}</span>
              <span class="counter-label">Clics</span>
            </div>
            <button @click="increment" class="counter-btn">+</button>
          </div>
          
          <div class="counter-actions">
            <button @click="resetCounter" class="action-btn">Reiniciar</button>
            <button @click="setRandom" class="action-btn">Aleatorio</button>
          </div>
        </div>
        
        <div class="code-preview">
          <code>&lt;Counter :value="count" @increment="count++" /&gt;</code>
        </div>
        
        <div class="feature-description" :class="{ active: activeFeature === 4 }">
          <p>Los componentes permiten encapsular funcionalidad reutilizable. Cada componente tiene su propio estado, métodos y template, facilitando el mantenimiento y escalabilidad.</p>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p>💡 <strong>Sugerencia:</strong> Pasa el cursor sobre cada tarjeta para ver una descripción detallada</p>
      <p>🎨 Diseño completamente responsive - Prueba en diferentes dispositivos</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Estado para controlar qué descripción está activa
const activeFeature = ref(0);

// Característica 1: Reactividad
const reactiveMessage = ref('¡Prueba la reactividad!');

// Característica 2: Directivas
const isVisible = ref(true);
const items = ref(['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4']);

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};

// Característica 3: Computed Properties
const price = ref(500);

const iva = computed(() => Math.round(price.value * 0.19));
const totalPrice = computed(() => price.value + iva.value);

// Característica 4: Componentes (Contador)
const counter = ref(0);

const increment = () => {
  counter.value++;
};

const decrement = () => {
  if (counter.value > 0) counter.value--;
};

const resetCounter = () => {
  counter.value = 0;
};

const setRandom = () => {
  counter.value = Math.floor(Math.random() * 100);
};
</script>

<style scoped>
.features-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1929 0%, #0d1b2a 100%);
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(0, 180, 216, 0.3);
}

.main-title {
  font-size: 2.8rem;
  font-weight: 900;
  color: #00b4d8;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.subtitle {
  font-size: 1.1rem;
  color: #90e0ef;
  font-weight: 300;
  letter-spacing: 1px;
}

/* Grid Responsivo */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

/* Tarjetas */
.feature-card {
  background: linear-gradient(145deg, #1b263b 0%, #0d1b2a 100%);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid #1b3a4b;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  height: 380px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.03);
  border-color: #00b4d8;
  box-shadow: 0 20px 40px rgba(0, 180, 216, 0.3);
  height: 480px;
  z-index: 10;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #00b4d8;
  text-align: center;
}

.card-title {
  font-size: 1.5rem;
  color: #ffffff;
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.demo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-input {
  width: 100%;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #1b3a4b;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s;
}

.demo-input:focus {
  outline: none;
  border-color: #00b4d8;
  background: rgba(0, 180, 216, 0.1);
}

.demo-output {
  background: rgba(0, 180, 216, 0.1);
  padding: 0.8rem;
  border-radius: 10px;
  border-left: 4px solid #00b4d8;
  color: #90e0ef;
  margin: 0;
}

.demo-button {
  background: linear-gradient(45deg, #0077b6, #0096c7);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.demo-button:hover {
  background: linear-gradient(45deg, #0096c7, #00b4d8);
  transform: scale(1.05);
}

.items-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.item {
  background: rgba(0, 180, 216, 0.2);
  padding: 0.6rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(0, 180, 216, 0.3);
  color: #90e0ef;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.price-slider {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #1b3a4b;
  outline: none;
  -webkit-appearance: none;
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #00b4d8;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 180, 216, 0.5);
}

.price-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00b4d8;
  min-width: 80px;
  text-align: right;
}

.calculation {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #1b3a4b;
}

.calc-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #1b3a4b;
}

.calc-line.total {
  border-bottom: none;
  font-weight: bold;
  font-size: 1.1rem;
  color: #00b4d8;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 2px solid #00b4d8;
}

.counter-widget {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
}

.counter-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #0077b6, #0096c7);
  border: none;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.counter-btn:hover {
  transform: scale(1.1);
  background: linear-gradient(45deg, #0096c7, #00b4d8);
}

.counter-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.counter-value {
  font-size: 3rem;
  font-weight: 900;
  color: #00b4d8;
  line-height: 1;
}

.counter-label {
  font-size: 0.9rem;
  color: #90e0ef;
  margin-top: 0.3rem;
}

.counter-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(0, 180, 216, 0.2);
  border: 1px solid #00b4d8;
  border-radius: 8px;
  color: #90e0ef;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.action-btn:hover {
  background: rgba(0, 180, 216, 0.4);
  transform: translateY(-2px);
}

.code-preview {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 0.8rem;
  margin: 1rem 0;
  border-left: 4px solid #0077b6;
  font-family: 'Courier New', monospace;
  color: #90e0ef;
  font-size: 0.9rem;
  text-align: center;
  overflow: hidden;
}

/* Descripción que aparece al hacer hover */
.feature-description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 20, 40, 0.95), transparent);
  padding: 2rem 1.5rem 1.5rem;
  transform: translateY(100%);
  transition: transform 0.4s ease;
  opacity: 0;
  border-top: 2px solid #00b4d8;
  backdrop-filter: blur(10px);
}

.feature-description.active {
  transform: translateY(0);
  opacity: 1;
}

.feature-description p {
  color: #caf0f8;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.feature-description strong {
  color: #00b4d8;
}

.footer-note {
  text-align: center;
  margin-top: 3rem;
  padding: 1.5rem;
  background: rgba(0, 180, 216, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(0, 180, 216, 0.3);
}

.footer-note p {
  color: #90e0ef;
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feature-card {
    height: 360px;
  }
  
  .feature-card:hover {
    height: 460px;
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    height: 340px;
  }
  
  .feature-card:hover {
    height: 440px;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .counter-widget {
    gap: 1rem;
  }
  
  .counter-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .features-container {
    padding: 1rem;
  }
  
  .header-section {
    padding: 1.5rem;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .feature-card {
    padding: 1.5rem;
    height: 320px;
  }
  
  .feature-card:hover {
    height: 420px;
  }
  
  .items-container {
    grid-template-columns: 1fr;
  }
}
</style>