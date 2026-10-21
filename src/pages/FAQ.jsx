import React from 'react';
import SEO from '../components/SEO';
import './InfoPages.css';

const FAQ = () => {
  return (
    <div className="info-page info-page--faq animate-fade-in">
      <SEO
        title="Frequently Asked Questions (FAQ) | Roshan Enterprises Dhanbad"
        description="Quick answers about online grocery orders, wholesale rates, delivery zones in Dhanbad, UPI payment verification, and returns."
        canonicalPath="/faq"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How do I place an order?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Browse our categories, add desired products to cart with retail or wholesale tiers, and proceed to checkout with instant UPI or Cash on Delivery.'
              }
            },
            {
              '@type': 'Question',
              name: 'How can I track my order in Dhanbad?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Open the Track Order page and enter your generated order ID (e.g., RE-XXXXX) to view live delivery milestones and dispatch status.'
              }
            },
            {
              '@type': 'Question',
              name: 'What is the return window for products?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'You can request a return within 7 days of delivery for eligible packaged household and grocery items.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do you offer free shipping in Dhanbad?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! Free doorstep shipping is available on qualifying orders above ₹499 across pin codes 826001, 826004, and 826010 in Dhanbad.'
              }
            }
          ]
        }}
      />
      <div className="info-shell">
        <div className="info-hero">
          <h1 className="info-title">Frequently Asked Questions</h1>
          <p className="info-lead">Quick answers to common questions about orders, shipping, returns, and accounts.</p>
        </div>

        <div className="info-panel">
          <section className="info-section">
            <h2>How do I place an order?</h2>
            <p>Browse categories, add products to cart, and proceed to checkout to place your order securely.</p>
          </section>
          <section className="info-section">
            <h2>How can I track my order?</h2>
            <p>Open the Track Order page and enter your order ID to view current shipping status.</p>
          </section>
          <section className="info-section">
            <h2>What is the return window?</h2>
            <p>You can request a return within 7 days of delivery for eligible products.</p>
          </section>
          <section className="info-section">
            <h2>Do you offer free shipping?</h2>
            <p>Yes, free shipping is available on qualifying orders as per the shipping policy.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
