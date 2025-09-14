import React from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { useState, useEffect } from 'react';
import '../../styles/TermsOfService.css';

export default function TermsOfService() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="terms-of-service-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      <main className="terms-of-service-main">
        <div className="terms-of-service-container">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: September 14, 2025</p>
          
          <div className="terms-of-service-content">
            <p>Welcome to BGr8! These Terms of Service ("Terms") govern your use of our mentoring platform and community development services. By accessing or using our Service, you agree to be bound by these Terms.</p>

            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the BGr8 website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>

            <h2>2. Description of Service</h2>
            <p>BGr8 is a charitable organization that provides:</p>
            <ul>
              <li>Mentoring platform connecting mentors and mentees</li>
              <li>Community development programs and support</li>
              <li>Educational resources and training materials</li>
              <li>Session booking and management system</li>
              <li>Feedback and evaluation systems</li>
              <li>Donation processing and community fund management</li>
              <li>Social media integration (Instagram, Facebook, etc.)</li>
            </ul>

            <h2>3. User Accounts and Registration</h2>
            <h3>3.1 Account Creation</h3>
            <p>To access certain features of our Service, you must register for an account. You agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3>3.2 Age Requirements</h3>
            <p>You must be at least 18 years old to create an account and use our mentoring services. Users between 13-17 may use our educational resources with parental consent.</p>

            <h2>4. User Conduct and Responsibilities</h2>
            <h3>4.1 Acceptable Use</h3>
            <p>You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Share false, misleading, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated systems to access our Service</li>
              <li>Interfere with the proper functioning of our Service</li>
            </ul>

            <h3>4.2 Mentoring Relationships</h3>
            <p>As a user of our mentoring platform, you agree to:</p>
            <ul>
              <li>Maintain professional boundaries in mentoring relationships</li>
              <li>Respect the privacy and confidentiality of other users</li>
              <li>Provide honest and constructive feedback</li>
              <li>Attend scheduled sessions or provide adequate notice for cancellations</li>
              <li>Use the platform solely for legitimate mentoring purposes</li>
            </ul>

            <h2>5. Content and Intellectual Property</h2>
            <h3>5.1 User-Generated Content</h3>
            <p>You retain ownership of content you create and share on our platform. By posting content, you grant BGr8 a non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of providing our services.</p>

            <h3>5.2 Our Content</h3>
            <p>All content, features, and functionality of our Service, including but not limited to text, graphics, logos, images, and software, are owned by BGr8 or our licensors and are protected by copyright, trademark, and other intellectual property laws.</p>

            <h2>6. Donations and Payments</h2>
            <h3>6.1 Donations</h3>
            <p>Donations made through our platform are used to support our community development programs and mentoring initiatives. All donations are final and non-refundable unless required by law.</p>

            <h3>6.2 Payment Processing</h3>
            <p>We use third-party payment processors to handle donations. By making a donation, you agree to the terms of service of our payment processors.</p>

            <h2>7. Privacy and Data Protection</h2>
            <p>Your privacy is important to us. Our collection and use of personal information is governed by our <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>

            <h2>8. Third-Party Services and Integrations</h2>
            <p>Our Service may integrate with third-party platforms including:</p>
            <ul>
              <li>Social media platforms (Instagram, Facebook, Twitter, LinkedIn)</li>
              <li>Payment processors</li>
              <li>Email services</li>
              <li>Analytics providers</li>
            </ul>
            <p>Your use of these third-party services is subject to their respective terms of service and privacy policies.</p>

            <h2>9. Disclaimers and Limitations of Liability</h2>
            <h3>9.1 Service Availability</h3>
            <p>We strive to maintain continuous service availability but cannot guarantee uninterrupted access. We may temporarily suspend or restrict access for maintenance, updates, or other operational reasons.</p>

            <h3>9.2 Limitation of Liability</h3>
            <p>To the maximum extent permitted by law, BGr8 shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising from your use of our Service.</p>

            <h3>9.3 No Warranty</h3>
            <p>Our Service is provided "as is" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

            <h2>10. Termination</h2>
            <h3>10.1 Termination by You</h3>
            <p>You may terminate your account at any time by contacting us or using account deletion features in your profile settings.</p>

            <h3>10.2 Termination by Us</h3>
            <p>We reserve the right to suspend or terminate your account immediately if you violate these Terms or engage in conduct that we determine to be harmful to our community or service.</p>

            <h2>11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless BGr8, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of our Service or violation of these Terms.</p>

            <h2>12. Governing Law and Dispute Resolution</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms or your use of our Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through our Service. Your continued use of our Service after changes are posted constitutes acceptance of the modified Terms.</p>

            <h2>14. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions shall remain in full force and effect.</p>

            <h2>15. Entire Agreement</h2>
            <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and BGr8 regarding your use of our Service.</p>

            <h2>16. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <ul>
              <li>By visiting our website: <a href="https://www.bgr8.uk" rel="external nofollow noopener" target="_blank">https://www.bgr8.uk</a></li>
              <li>By email: support@bgr8.com</li>
              <li>By phone: +44 123 456 7890</li>
            </ul>

            <h2>17. Charity Information</h2>
            <p>BGr8 is a registered charity in England and Wales. Our charitable objectives include:</p>
            <ul>
              <li>Providing mentorship and educational support to individuals and communities</li>
              <li>Supporting community development and empowerment programs</li>
              <li>Facilitating connections between mentors and mentees for mutual benefit</li>
              <li>Promoting social inclusion and equal opportunities</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
