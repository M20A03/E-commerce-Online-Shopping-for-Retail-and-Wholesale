// Enterprise SEO component with dynamic metadata, canonical links, OpenGraph, Twitter Cards, Geotagging, and JSON-LD Schema Graph
import { useEffect } from 'react';

const SITE_NAME = 'Roshan Enterprises';
const BASE_URL = 'https://e-commerce-roshan-enterprises-dhn.web.app';
const DEFAULT_IMAGE = `${BASE_URL}/hero_banner.webp`;

export default function SEO({
  title = 'Roshan Enterprises | Online Shopping Dhanbad | Retail & Wholesale',
  description = 'Buy cooking oils, Assam tea, laundry detergent, and daily household essentials online in Dhanbad at wholesale rates with fast doorstep delivery.',
  keywords = 'Roshan Enterprises, online grocery Dhanbad, mustard oil Dhanbad, Assam tea Dhanbad, wholesale household products, Satyam Nagar Dhanbad grocery, grocery delivery 826010',
  canonicalPath = '',
  ogType = 'website',
  type = null,
  ogImage = null,
  image = null,
  jsonLd = null,
  schema = null,
  breadcrumbs = null,
  noindex = false,
}) {
  const resolvedType = type || ogType;
  const resolvedImage = image || ogImage || DEFAULT_IMAGE;
  const resolvedJsonLd = schema || jsonLd;
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const setMetaTag = (selector, attrName, attrValue, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    setMetaTag(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaTag('meta[name="author"]', 'name', 'author', SITE_NAME);

    // Local Geo SEO tags
    setMetaTag('meta[name="geo.region"]', 'name', 'geo.region', 'IN-JH');
    setMetaTag('meta[name="geo.placename"]', 'name', 'geo.placename', 'Dhanbad, Jharkhand, India');
    setMetaTag('meta[name="geo.position"]', 'name', 'geo.position', '23.8450;86.4325');
    setMetaTag('meta[name="ICBM"]', 'name', 'ICBM', '23.8450, 86.4325');

    // 3. Open Graph Tags
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', resolvedType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', resolvedImage);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');

    // 4. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Structured Data Graph
    let scriptTag = document.getElementById('dynamic-jsonld');
    const schemas = [];

    // Auto-generate BreadcrumbList schema if provided
    if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => {
          const rawPath = crumb.path || crumb.url || '';
          const fullItemUrl = rawPath.startsWith('http')
            ? rawPath
            : `${BASE_URL}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;
          return {
            '@type': 'ListItem',
            position: idx + 1,
            name: crumb.name,
            item: fullItemUrl,
          };
        }),
      });
    }

    if (resolvedJsonLd) {
      if (Array.isArray(resolvedJsonLd)) {
        schemas.push(...resolvedJsonLd);
      } else {
        schemas.push(resolvedJsonLd);
      }
    }

    if (schemas.length > 0) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : { '@context': 'https://schema.org', '@graph': schemas });
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonicalPath, resolvedType, resolvedImage, resolvedJsonLd, breadcrumbs, noindex]);

  return null;
}
