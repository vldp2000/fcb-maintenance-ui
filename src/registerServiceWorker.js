/* eslint-disable no-console */

import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.debug(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered () {
      console.debug('Service worker has been registered.')
    },
    cached () {
      console.debug('Content has been cached for offline use.')
    },
    updatefound () {
      console.debug('New content is downloading.')
    },
    updated (registration) {
      console.info('New content is available and will be used on the next page load.')
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    },
    offline () {
      console.debug('No internet connection found. App is running in offline mode.')
    },
    error (error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
