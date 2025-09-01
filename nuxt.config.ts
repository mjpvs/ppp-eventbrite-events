// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    EB_TOKEN: process.env.EB_TOKEN,
    EB_ORG_ID: process.env.EB_ORG_ID,
    public: {
      G_API_KEY: process.env.G_API_KEY,
      MAP_ID: process.env.MAP_ID,
    }
  },
  app: {
    head: {
      title: 'People Planet Pint | Upcoming Events',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
        }
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
          tagPosition: 'bodyClose'
        }
      ]
    }
  },
})
