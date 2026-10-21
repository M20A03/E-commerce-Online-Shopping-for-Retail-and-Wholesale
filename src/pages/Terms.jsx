import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const Terms = () => {
  return (
    <div className="info-page info-page--terms animate-fade-in">
      <SEO
        title="Terms & Conditions | Roshan Enterprises Dhanbad"
        description="Review the terms and conditions for ordering, payments, and delivery services provided by Roshan Enterprises Dhanbad."
        canonicalPath="/terms"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Terms & Conditions', url: '/terms' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Terms and Conditions',
          'description': 'Roshan Enterprises terms of service, payment guidelines, and conditions of order placement.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Roshan Enterprises'
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Terms and Conditions</h1>
          <p className="info-lead">Please review these terms before using our services and placing orders.</p>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Use of Service</h2>
            <p>By using this website, you agree to provide correct information and comply with applicable laws.</p>
          </section>
          <section className="info-section">
            <h2>Orders and Payments</h2>
            <p>All orders are subject to confirmation, stock availability, and successful payment processing.</p>
          </section>
          <section className="info-section">
            <h2>Pricing and Availability</h2>
            <p>Prices and product availability may change without prior notice due to market and supplier updates.</p>
          </section>
          <section className="info-section">
            <h2>Liability</h2>
            <p>We are committed to service quality but are not responsible for delays caused by events beyond operational control.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
