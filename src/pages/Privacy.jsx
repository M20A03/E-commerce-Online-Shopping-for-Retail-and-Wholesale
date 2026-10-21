import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const Privacy = () => {
  return (
    <div className="info-page info-page--privacy animate-fade-in">
      <SEO
        title="Privacy Policy | Roshan Enterprises Dhanbad"
        description="Roshan Enterprises data protection and privacy policy. Learn how customer information is safeguarded and used to fulfill orders."
        canonicalPath="/privacy"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Privacy Policy',
          'description': 'Roshan Enterprises privacy and customer data protection guidelines.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Roshan Enterprises'
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Privacy Policy</h1>
          <p className="info-lead">Your privacy matters to us. This page explains what data we collect and how we use it.</p>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Information We Collect</h2>
            <ul>
              <li>Account details such as name, email, and phone number.</li>
              <li>Order and payment related transaction data.</li>
              <li>Website usage data to improve service quality.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>How We Use Data</h2>
            <ul>
              <li>To process and deliver your orders.</li>
              <li>To provide customer support and account security.</li>
              <li>To improve product recommendations and website experience.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>Data Protection</h2>
            <p>We use secure systems and restricted access controls to protect customer information.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
