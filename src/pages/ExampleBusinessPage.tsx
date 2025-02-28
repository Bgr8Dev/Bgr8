import React from 'react';
import { ComingSoonOverlay } from '../components/ComingSoonOverlay';

/**
 * This is an example business page to demonstrate how to use the ComingSoonOverlay component.
 * You can apply this pattern to any of your business pages.
 */
export function ExampleBusinessPage() {
  return (
    // Simply wrap your existing page content with the ComingSoonOverlay component
    // and pass the appropriate businessId for the page
    <ComingSoonOverlay businessId="exampleBusiness">
      <div style={{ padding: '40px 20px' }}>
        <h1>Example Business Page</h1>
        <p>
          This is an example of how to implement the Coming Soon overlay on a business page.
          When this business is marked as "grayed out" in the admin settings, a "Coming Soon"
          banner will appear at the top of this page.
        </p>
        
        <section style={{ marginTop: '30px' }}>
          <h2>How to Use the Coming Soon Overlay</h2>
          <p>
            To add the Coming Soon overlay to any business page:
          </p>
          <ol>
            <li>Import the ComingSoonOverlay component</li>
            <li>Wrap your page content with the ComingSoonOverlay component</li>
            <li>Pass the appropriate businessId as a prop to the ComingSoonOverlay</li>
          </ol>
          
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
{`import { ComingSoonOverlay } from '../components/ComingSoonOverlay';

export function BusinessPage() {
  return (
    <ComingSoonOverlay businessId="businessName">
      {/* Your existing page content */}
      <h1>Your Business Page</h1>
      {/* ... */}
    </ComingSoonOverlay>
  );
}`}
          </pre>
        </section>
        
        <section style={{ marginTop: '30px' }}>
          <h2>Managing Coming Soon Status</h2>
          <p>
            Admins can control which pages show the Coming Soon overlay in the Admin Settings page.
            Look for the "Coming Soon Page Overlay" section in the Admin Settings.
          </p>
        </section>
      </div>
    </ComingSoonOverlay>
  );
} 