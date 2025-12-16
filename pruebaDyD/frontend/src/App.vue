<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="title">SISTEMA DE GESTIÓN DE ARCHIVOS</h1>
        <div class="project-name">PRUEBADYD - SISTEMA DE ARCHIVOS</div>
        
        <!-- Navegación -->
        <nav class="app-nav">
          <router-link to="/" class="nav-link" exact-active-class="active">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Demo Vue.js</span>
          </router-link>
          <router-link to="/files" class="nav-link" exact-active-class="active">
            <span class="nav-icon">📁</span>
            <span class="nav-text">Gestión de Archivos</span>
          </router-link>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>Sistema desarrollado con Vue.js 3 + Firebase + JSZip</p>
      <p>Proyecto: PruebaDyD - 2025</p>
    </footer>
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
  color: white;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(13, 27, 42, 0.95);
  padding: 0.8rem 1.5rem;
  border-bottom: 3px solid #00b4d8;
  text-align: center;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 3px;
  color: #00b4d8;
  text-shadow: 0 0 15px rgba(0, 180, 216, 0.5);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 2px;
  color: #90e0ef;
  margin-bottom: 1rem;
}

.project-name {
  display: inline-block;
  background: linear-gradient(45deg, #0077b6, #0096c7);
  color: white;
  padding: 0.3rem 1.2rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
  letter-spacing: 1px;
  margin-bottom: 0.8rem;
}

.app-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  background: rgba(255, 255, 255, 0.1);
  color: #90e0ef;
  text-decoration: none;
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s;
  border: 1px solid rgba(0, 180, 216, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background: rgba(0, 180, 216, 0.2);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 180, 216, 0.2);
}

.nav-link.active {
  background: linear-gradient(45deg, #0077b6, #0096c7);
  color: white;
  border-color: #00b4d8;
  box-shadow: 0 4px 15px rgba(0, 180, 216, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-size: 0.9rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: rgba(13, 27, 42, 0.95);
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #1b3a4b;
  font-size: 0.9rem;
  color: #90e0ef;
}

.app-footer p {
  margin: 0.25rem 0;
}

@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .app-nav {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-link {
    width: 100%;
    max-width: 250px;
    justify-content: center;
  }
}
</style>