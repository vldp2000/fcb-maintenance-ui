const packageJson = require('./package.json')

process.env.VUE_APP_VERSION = packageJson.version

module.exports = {
  'transpileDependencies': [
    'vuetify'
  ],
  pwa: {
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true
    }
  }
}
