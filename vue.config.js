const packageJson = require('./package.json')

process.env.VUE_APP_VERSION = packageJson.version

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  css: {
    loaderOptions: {
      sass: { sassOptions: { quietDeps: true } },
      scss: { sassOptions: { quietDeps: true } }
    }
  },
  pwa: {
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true
    }
  }
}
