import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const ShippingPolicy = () => {
  return (
    <div className="info-page info-page--shipping animate-fade-in">
      <SEO
        title="Shipping & Delivery Policy | Roshan Enterprises Dhanbad"
        description="Learn about Roshan Enterprises shipping timelines, delivery charges, express delivery across Dhanbad & Jharkhand, and free shipping on orders above ₹500."
        canonicalPath="/shipping-policy"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shipping Policy', url: '/shipping-policy' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Shipping and Delivery Policy',
          'description': 'Shipping timelines, rates, and delivery policy for Roshan Enterprises Dhanbad.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Roshan Enterprises'
          }
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Shipping Policy</h1>
          <p className="info-lead">Clear delivery timelines and charges for all orders placed on our website.</p>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>Delivery Timeline</h2>
            <ul>
              <li>Standard delivery: 3 to 5 business days.</li>
              <li>Express delivery (select areas): 1 to 2 business days.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>Shipping Charges</h2>
            <ul>
              <li>Orders below 500: standard delivery charge applies.</li>
              <li>Orders at or above 500: free standard shipping.</li>
            </ul>
          </section>
          <section className="info-section">
            <h2>Order Tracking</h2>
            <p>Once dispatched, tracking details are available from the Track Order page.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
