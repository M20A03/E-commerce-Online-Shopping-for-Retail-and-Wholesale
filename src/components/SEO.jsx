// IMPROVEMENT: Dependency-free SEO component for dynamic metadata, canonical links, OpenGraph, and JSON-LD structured data
import { useEffect } from 'react';

const SITE_NAME = 'Roshan Enterprises';
const BASE_URL = 'https://e-commerce-roshan-enterprises-dhn.web.app';
const DEFAULT_IMAGE = `${BASE_URL}/hero_banner.webp`;

export default function SEO({
  title = 'Roshan Enterprises | Online Shopping Dhanbad | Retail & Wholesale',
  description = 'Buy cooking oils, Assam tea, laundry detergent, and daily household essentials online in Dhanbad at wholesale rates with fast doorstep delivery.',
  keywords = 'Roshan Enterprises, online grocery Dhanbad, mustard oil Dhanbad, Assam tea Dhanbad, wholesale household products, Satyam Nagar Dhanbad grocery',
  canonicalPath = '',
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  jsonLd = null,
}) {
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
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');
    setMetaTag('meta[name="author"]', 'name', 'author', SITE_NAME);

    // 3. Open Graph Tags
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);

    // 4. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Structured Data
    let scriptTag = document.getElementById('dynamic-jsonld');
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonicalPath, ogType, ogImage, jsonLd]);

  return null;
}
