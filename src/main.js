import Vue from 'vue'
import VCalendar from 'v-calendar'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(VCalendar)

new Vue({
  render: h => h(App),
}).$mount('#app')
