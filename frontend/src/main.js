import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Tải router
import './assets/css/main.scss' // Tải SCSS custom & Bootstrap
import 'bootstrap'

const app = createApp(App)

app.use(router) // Kích hoạt router
app.mount('#app')