import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cvicc.org'

  const staticRoutes = [
    '', '/about', '/about/leadership', '/about/sectors', '/about/initiatives',
    '/members', '/members/mentorship',
    '/events', '/join', '/partners', '/contact',
  ]

  return staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/events' ? 0.9 : 0.7,
  }))
}
