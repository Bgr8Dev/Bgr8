import React, { useState } from 'react';
import { CategoryManager } from './CategoryManager';
import { SoftwareManager } from './SoftwareManager';
import { ServiceManager } from './ServiceManager';
import { CompanyManager } from './CompanyManager';
import { PricingManager } from './PricingManager';
import { initializeMarketingData } from '../../../services/marketingService';
import { FaSpinner, FaDatabase, FaToolbox, FaCog, FaBuilding, FaTags, FaMoneyBillWave } from 'react-icons/fa';

// Tab types
type TabType = 'categories' | 'software' | 'services' | 'companies' | 'pricing';

export const MarketingContentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationMessage, setInitializationMessage] = useState('');

  // Initialize default data if needed
  const handleInitializeData = async () => {
    if (!window.confirm('This will initialize the marketing data with default values. Continue?')) return;
    
    setIsInitializing(true);
    setInitializationMessage('Initializing marketing data...');
    
    try {
      // Initialize default categories
      const defaultCategories = [
        { name: 'All', isActive: true, orderIndex: 0 },
        { name: 'CMS', isActive: true, orderIndex: 1 },
        { name: 'SEO & Analytics', isActive: true, orderIndex: 2 },
        { name: 'Plugins', isActive: true, orderIndex: 3 },
        { name: 'Digital Media', isActive: true, orderIndex: 4 },
        { name: 'Developer Tools', isActive: true, orderIndex: 5 },
        { name: 'Programming Languages', isActive: true, orderIndex: 6 },
        { name: 'Frameworks', isActive: true, orderIndex: 7 },
        { name: 'Cloud Services', isActive: true, orderIndex: 8 },
        { name: 'Tech Solutions', isActive: true, orderIndex: 9 }
      ];

      // Initialize default software tools
      const defaultSoftware = [
        {
          name: 'WordPress',
          description: 'World\'s most popular CMS platform for website creation and content management',
          category: 'CMS',
          iconName: 'wordpress',
          isActive: true
        },
        {
          name: 'Google Analytics',
          description: 'Advanced analytics platform for measuring website and app performance',
          category: 'SEO & Analytics',
          iconName: 'google-analytics',
          isActive: true
        },
        {
          name: 'Adobe Creative Suite',
          description: 'Professional creative tools including Photoshop and Premiere Pro',
          category: 'Digital Media',
          iconName: 'adobe',
          isActive: true
        },
        {
          name: 'React',
          description: 'Popular JavaScript library for building user interfaces',
          category: 'Frameworks',
          iconName: 'react',
          isActive: true
        }
      ];

      // Initialize default services
      const defaultServices = [
        {
          category: 'Web Marketing',
          title: 'Digital Web Marketing',
          services: [
            'Search Engine Optimization (SEO)',
            'Content Marketing Strategy',
            'Email Marketing Campaigns',
            'Google Ads Management',
            'Website Analytics & Optimization',
            'Landing Page Optimization'
          ],
          price: 'Starting from $1000/month',
          iconName: 'globe',
          isActive: true
        },
        {
          category: 'Social Media',
          title: 'Social Media Marketing',
          services: [
            'Social Media Management',
            'Influencer Partnerships',
            'Content Creation & Scheduling',
            'Community Engagement',
            'Paid Social Advertising',
            'Social Media Analytics'
          ],
          price: 'Starting from $800/month',
          iconName: 'hashtag',
          isActive: true
        }
      ];

      // Initialize default pricing plans
      const defaultPricingPlans = [
        {
          title: 'Basic Marketing Package',
          price: '$500/month',
          description: 'Perfect for startups looking to establish their online presence.',
          iconName: 'chart',
          isActive: true,
          orderIndex: 0
        },
        {
          title: 'Advanced Marketing Strategy',
          price: '$1500/month',
          description: 'Ideal for growing businesses wanting aggressive growth strategies.',
          iconName: 'bullhorn',
          isActive: true,
          orderIndex: 1
        },
        {
          title: 'Custom Campaigns',
          price: 'Contact us for pricing',
          description: 'Tailored solutions for unique marketing needs.',
          iconName: 'cogs',
          isActive: true,
          orderIndex: 2
        }
      ];

      // Initialize data in Firestore
      setInitializationMessage('Creating categories...');
      
      // Companies can't be initialized this way since they need image files
      // Only initialize categories, software, services, and pricing plans
      await initializeMarketingData(
        defaultCategories,
        defaultSoftware,
        defaultServices,
        defaultPricingPlans
      );
      
      setInitializationMessage('Data initialized successfully! Please refresh the page to see the changes.');
    } catch (error) {
      console.error('Error initializing data:', error);
      setInitializationMessage('Error initializing data. See console for details.');
    } finally {
      setTimeout(() => {
        setIsInitializing(false);
        setInitializationMessage('');
      }, 5000);
    }
  };

  return (
    <div className="marketing-content-manager">
      <div className="admin-header">
        <div>
          <h2>Innov8 Content Manager</h2>
          <p>Manage and customize content displayed on the Innov8 page</p>
        </div>
        
        {/* Initialize data button */}
        <div className="init-data-section">
          <button
            onClick={handleInitializeData}
            disabled={isInitializing}
            className="admin-btn admin-btn-primary"
          >
            {isInitializing ? (
              <>
                <FaSpinner className="spinner" /> Initializing...
              </>
            ) : (
              <>
                <FaDatabase /> Initialize Default Data
              </>
            )}
          </button>
          {initializationMessage && (
            <div className={`initialization-message ${
              initializationMessage.includes('success') ? 'success' : 
              initializationMessage.includes('Error') ? 'error' : ''
            }`}>
              {initializationMessage}
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FaTags /> Categories
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'software' ? 'active' : ''}`}
            onClick={() => setActiveTab('software')}
          >
            <FaToolbox /> Software Tools
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <FaCog /> Services
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <FaBuilding /> Companies
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <FaMoneyBillWave /> Pricing Plans
          </button>
        </li>
      </ul>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'software' && <SoftwareManager />}
        {activeTab === 'services' && <ServiceManager />}
        {activeTab === 'companies' && <CompanyManager />}
        {activeTab === 'pricing' && <PricingManager />}
      </div>
    </div>
  );
}; 