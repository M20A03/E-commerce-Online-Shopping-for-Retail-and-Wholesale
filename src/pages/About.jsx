import React from 'react';
import { Users, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';
import SEO from '../components/SEO';
import './InfoPages.css';

const About = () => {
  return (
    <div className="info-page info-page--about animate-fade-in">
      <SEO
        title="About Us | Heritage & Quality Standards | Roshan Enterprises Dhanbad"
        description="Discover the story of Roshan Enterprises, Dhanbad's trusted retail & wholesale distributor of premium cooking oils, authentic Assam tea, and daily household supplies."
        canonicalPath="/about"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About Us', path: '/about' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Roshan Enterprises',
          description: 'Local-first retail and wholesale distributor in Dhanbad, Jharkhand specializing in quality cooking oils, authentic teas, and household staples.',
          publisher: {
            '@type': 'Organization',
            name: 'Roshan Enterprises',
            url: 'https://e-commerce-roshan-enterprises-dhn.web.app/'
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">About Roshan Enterprises</h1>
          <p className="info-lead">
            We are a local-first retail business focused on dependable quality in daily essentials like cooking oil, tea,
            detergents, and household products. Our mission is simple: honest pricing, trusted quality, and reliable service.
          </p>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <Users size={20} />
            <h3>Customer Focused</h3>
            <p>We prioritize long-term customer trust over short-term sales.</p>
          </article>
          <article className="info-card">
            <ShieldCheck size={20} />
            <h3>Quality Assured</h3>
            <p>Products are selected from reliable suppliers with strict quality checks.</p>
          </article>
          <article className="info-card">
            <Truck size={20} />
            <h3>Fast Fulfillment</h3>
            <p>We process orders quickly so essential items reach your home on time.</p>
          </article>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Our Story</h2>
            <p>
              Roshan Enterprises started with a commitment to serve homes and families with practical, high-quality products
              at fair prices. As customer needs grew, we expanded categories while keeping service personal and transparent.
            </p>
          </section>
          <section className="info-section">
            <h2>What Makes Us Different</h2>
            <ul>
              <li>Focused catalog with only useful household products.</li>
              <li>Simple shopping flow with secure checkout.</li>
              <li>Clear policies for shipping, returns, and support.</li>
              <li>Responsive customer help for order and account issues.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>Our Promise</h2>
            <p>
              <HeartHandshake size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              We deliver value through consistency, clarity, and quality in every order.
            </p>
          </section>
          <section className="info-section">
            <h2>Visit Us</h2>
            <p>
              <strong>Address:</strong> RCVG+6G, Satyam Nagar, Dhanbad, Jharkhand 826010<br />
              <strong>Phone:</strong> +91 7004634675
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
