import { createApp } from 'vue'
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue'
import { pinia } from './plugins/pinia'
import router from './router'

const app = createApp(App)

app.use(pinia)
app.use(router)

const vuetify = createVuetify({
  components,
  directives,
});

app.use(vuetify);

app.mount('#app')
