import { createRouter, createWebHistory } from 'vue-router'
import FeaturesDemo from '@/components/FeaturesDemo.vue'
import FileManager from '@/components/FileManager.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: FeaturesDemo
  },
  {
    path: '/files',
    name: 'files',
    component: FileManager
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router