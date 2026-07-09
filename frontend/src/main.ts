import { createApp } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import {
  VApp,
  VBtn,
  VCard,
  VCol,
  VContainer,
  VDivider,
  VMain,
  VRow,
  VSheet,
} from 'vuetify/components'

import App from './App.vue'
import { pinia } from './plugins/pinia'
import router from './router'

const app = createApp(App)

app.use(pinia)
app.use(router)

const vuetify = createVuetify({
  components: {
    VApp,
    VBtn,
    VCard,
    VCol,
    VContainer,
    VDivider,
    VMain,
    VRow,
    VSheet,
  },
})

app.use(vuetify)

app.mount('#app')
