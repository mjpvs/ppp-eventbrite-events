// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    EB_TOKEN: process.env.EB_TOKEN,
    EB_ORG_ID: process.env.EB_ORG_ID,
  }
})
