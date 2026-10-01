import Vue from 'vue'
import Vuetify from 'vuetify/lib'
// Bundle the icon font so the controller can serve it without an internet connection.
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  }
})
