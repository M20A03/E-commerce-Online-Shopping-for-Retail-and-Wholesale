import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const ReturnPolicy = () => {
  return (
    <div className="info-page info-page--returns animate-fade-in">
      <SEO
        title="Return & Refund Policy | Roshan Enterprises Dhanbad"
        description="Roshan Enterprises return and refund policy. 7-day hassle-free returns for eligible consumer and wholesale grocery items with prompt refund processing."
        canonicalPath="/return-policy"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Return Policy', url: '/return-policy' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Return and Refund Policy',
          'description': 'Roshan Enterprises 7-day hassle-free return and refund guidelines for retail and wholesale customers.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Roshan Enterprises'
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Return Policy</h1>
          <p className="info-lead">Simple return process for eligible products to ensure a hassle-free experience.</p>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Return Window</h2>
            <p>Returns can be requested within 7 days of delivery for eligible items.</p>
          </section>
          <section className="info-section">
            <h2>Eligibility</h2>
            <ul>
              <li>Product must be unused and in original packaging.</li>
              <li>Invoice or order confirmation is required.</li>
              <li>Damaged or wrong items should be reported quickly with photos.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>Refund Process</h2>
            <p>After quality check, approved refunds are processed to the original payment method in 5 to 7 business days.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
