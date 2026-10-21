import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const ContactUs = () => {
  const mapUrl = 'https://www.google.com/maps?q=23.84500,86.43258&output=embed';

  return (
    <div className="info-page info-page--contact animate-fade-in">
      <SEO
        title="Contact Us & Wholesale Inquiries | Roshan Enterprises Dhanbad"
        description="Get in touch with Roshan Enterprises in Satyam Nagar, Dhanbad. Contact us for bulk wholesale rates, retail orders, or WhatsApp support at +91 7004634675."
        canonicalPath="/contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact Us', path: '/contact' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Roshan Enterprises',
          description: 'Official customer support and wholesale inquiries contact desk for Roshan Enterprises Dhanbad.',
          mainEntity: {
            '@type': 'LocalBusiness',
            name: 'Roshan Enterprises',
            telephone: '+917004634675',
            email: 'surendrakumardhn@gmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'RCVG+6G, Satyam Nagar',
              addressLocality: 'Dhanbad',
              addressRegion: 'Jharkhand',
              postalCode: '826010',
              addressCountry: 'IN'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 23.8450,
              longitude: 86.4325
            }
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Contact Us</h1>
          <p className="info-lead">We are here to help with orders, delivery, product availability, and support requests.</p>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <h3>Phone Support</h3>
            <p>+91 7004634675</p>
            <p>Mon - Sat, 9:00 AM to 8:00 PM</p>
          </article>
          <article className="info-card">
            <h3>Email</h3>
            <p>surendrakumardhn@gmail.com</p>
            <p>Response within 24 hours</p>
          </article>
          <article className="info-card">
            <h3>Store Address</h3>
            <p>RCVG+6G, Satyam Nagar</p>
            <p>Dhanbad, Jharkhand 826010</p>
          </article>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Business Hours</h2>
            <ul>
              <li>Monday to Friday: 9:00 AM - 8:00 PM</li>
              <li>Saturday: 10:00 AM - 6:00 PM</li>
              <li>Sunday: Limited support for urgent order issues</li>
            </ul>
          </section>

          <section className="info-section">
            <h2>Find Us on Map</h2>
            <p>Our store location is shown below for quick navigation and easy access.</p>
            <div className="info-map-shell">
              <iframe
                title="Roshan Enterprises location"
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
