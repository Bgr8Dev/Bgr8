import React, { useState, useEffect, useRef } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as SiIcons from 'react-icons/si';

// Map of icon names to their React component
const iconMap: Record<string, React.ReactNode> = {
  // Social Media
  'linkedin': <FaIcons.FaLinkedin size={24} />, 
  'instagram': <FaIcons.FaInstagram size={24} />, 
  'youtube': <FaIcons.FaYoutube size={24} />, 
  'twitter': <FaIcons.FaTwitter size={24} />,
  'facebook': <FaIcons.FaFacebook size={24} />,
  'snapchat': <FaIcons.FaSnapchat size={24} />,
  'tiktok': <FaIcons.FaTiktok size={24} />,
  
  // Marketing & Business icons
  'globe': <FaIcons.FaGlobe size={24} />,
  'hashtag': <FaIcons.FaHashtag size={24} />,
  'chart': <FaIcons.FaChartLine size={24} />,
  'bullhorn': <FaIcons.FaBullhorn size={24} />,
  'cogs': <FaIcons.FaCogs size={24} />,
  'ad': <FaIcons.FaAd size={24} />,
  'comments': <FaIcons.FaCommentDots size={24} />,
  'desktop': <FaIcons.FaDesktop size={24} />,
  'mobile': <FaIcons.FaMobileAlt size={24} />,
  'briefcase': <FaIcons.FaBriefcase size={24} />,
  'shopping': <FaIcons.FaShoppingCart size={24} />,
  'creditcard': <FaIcons.FaCreditCard size={24} />,
  'email': <FaIcons.FaEnvelope size={24} />,
  'users': <FaIcons.FaUserFriends size={24} />,
  'star': <FaIcons.FaStar size={24} />,
  'trophy': <FaIcons.FaTrophy size={24} />,
  'chartbar': <FaIcons.FaChartBar size={24} />,
  'table': <FaIcons.FaTable size={24} />,
  'check': <FaIcons.FaCheck size={24} />,
  'lightbulb': <FaIcons.FaLightbulb size={24} />,
  'gem': <FaIcons.FaGem size={24} />,
  'newspaper': <FaIcons.FaNewspaper size={24} />,
  'paperplane': <FaIcons.FaPaperPlane size={24} />,
  'wrench': <FaIcons.FaWrench size={24} />,
  'moneybill': <FaIcons.FaMoneyBillWave size={24} />,
  
  // CMS & Tools
  'wordpress': <FaIcons.FaWordpress size={24} />,
  'google': <FaIcons.FaGoogle size={24} />,
  'camera': <FaIcons.FaCamera size={24} />,
  'code': <FaIcons.FaCode size={24} />,
  'searchengine': <FaIcons.FaSearchengin size={24} />,
  'calendar': <FaIcons.FaCalendarAlt size={24} />,
  'stream': <FaIcons.FaStream size={24} />,
  'video': <FaIcons.FaVideo size={24} />,
  'palette': <FaIcons.FaPalette size={24} />,
  'hubspot': <FaIcons.FaHubspot size={24} />,
  'database': <FaIcons.FaDatabase size={24} />,
  'cloud': <FaIcons.FaCloud size={24} />,
  
  // Programming & Tech
  'react': <FaIcons.FaReact size={24} />,
  'node': <FaIcons.FaNode size={24} />,
  'python': <FaIcons.FaPython size={24} />,
  'javascript': <FaIcons.FaJs size={24} />,
  'android': <FaIcons.FaAndroid size={24} />,
  'apple': <FaIcons.FaApple size={24} />,
  'angular': <FaIcons.FaAngular size={24} />,
  'vue': <FaIcons.FaVuejs size={24} />,
  'stripe': <FaIcons.FaStripe size={24} />,
  'robot': <FaIcons.FaRobot size={24} />,
  'server': <FaIcons.FaServer size={24} />,
  'firebase': <FaIcons.FaFire size={24} />,
  'map': <FaIcons.FaMap size={24} />,
  'brain': <FaIcons.FaBrain size={24} />,
  'microchip': <FaIcons.FaMicrochip size={24} />,
  
  // Specific Products (SI icons)
  'adobe': <SiIcons.SiAdobecreativecloud size={24} />,
  'hubspot-si': <SiIcons.SiHubspot size={24} />,
  'mailchimp': <SiIcons.SiMailchimp size={24} />,
  'google-analytics': <SiIcons.SiGoogleanalytics size={24} />,
  'google-adsense': <SiIcons.SiGoogleadsense size={24} />,
  'canva': <SiIcons.SiCanva size={24} />,
  'davinci': <SiIcons.SiDavinciresolve size={24} />,
  'search-console': <SiIcons.SiGooglesearchconsole size={24} />,
  
  // Adding all remaining icons dynamically
  ...Object.keys(FaIcons).reduce((acc: { [key: string]: React.ReactElement }, key) => {
    if (key.startsWith('Fa')) {
      acc[key.replace('Fa', '').toLowerCase()] = React.createElement(FaIcons[key as keyof typeof FaIcons], { size: 24 });
    }
    return acc;
  }, {}),
  ...Object.keys(SiIcons).reduce((acc: { [key: string]: React.ReactElement }, key) => {
    if (key.startsWith('Si')) {
      acc[key.replace('Si', '').toLowerCase()] = React.createElement(SiIcons[key as keyof typeof SiIcons], { size: 24 });
    }
    return acc;
  }, {})
};

// Function to render an icon by name
// eslint-disable-next-line react-refresh/only-export-components
export const renderIcon = (iconName: string): React.ReactNode => {
  return iconMap[iconName.toLowerCase()] || <FaIcons.FaGlobe size={24} />;
};

// Get all available icon names for the icon picker
// eslint-disable-next-line react-refresh/only-export-components
export const getAvailableIcons = (): {name: string, icon: React.ReactNode}[] => {
  return Object.entries(iconMap).map(([name, icon]) => ({
    name,
    icon
  }));
};

// Create an enhanced icon picker component
export const IconPicker: React.FC<{
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}> = ({ selectedIcon, onSelectIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const icons = getAvailableIcons();

  // Filter icons based on search term
  const filteredIcons = icons.filter(({ name }) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group icons by category for better organization
  const iconCategories = {
    social: ['linkedin', 'instagram', 'youtube', 'twitter', 'facebook', 'snapchat', 'tiktok'],
    marketing: ['globe', 'hashtag', 'chart', 'bullhorn', 'cogs', 'ad', 'comments', 'moneybill'],
    business: ['briefcase', 'shopping', 'creditcard', 'email', 'users', 'star', 'trophy'],
    technology: ['desktop', 'mobile', 'code', 'server', 'database', 'cloud', 'brain', 'microchip'],
    design: ['palette', 'camera', 'video'],
    products: ['wordpress', 'google', 'react', 'node', 'python', 'javascript', 'android', 'apple', 'angular', 'vue', 'stripe', 'firebase', 'adobe', 'hubspot-si', 'mailchimp', 'google-analytics', 'canva', 'davinci']
  };

  // Create a list of all categorized icons
  const categorizedIcons = Object.values(iconCategories).flat();
  
  // Get uncategorized icons (dynamically generated ones)
  const otherIcons = icons
    .filter(({ name }) => !categorizedIcons.includes(name))
    .map(({ name }) => name);

  // Close the picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentIcon = renderIcon(selectedIcon);

  return (
    <div ref={pickerRef} className="icon-picker-container" style={{ position: 'relative', zIndex: 100 }}>
      <div 
        className="selected-icon-display" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 101,
          position: 'relative'
        }}
      >
        {currentIcon}
        <span className="icon-name">{selectedIcon}</span>
      </div>
      
      {isOpen && (
        <div 
          className="icon-picker-dropdown"
          style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            width: '300px',
            maxHeight: '300px',
            overflowY: 'auto',
            background: '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '10px',
            zIndex: 102,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          <div className="icon-search">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="icon-grid">
            {searchTerm ? (
              // Show search results
              <div className="icon-category">
                <h5>Search Results</h5>
                <div className="icon-category-grid">
                  {filteredIcons.map(({ name, icon }) => (
                    <div 
                      key={name}
                      className={`icon-item ${name === selectedIcon ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectIcon(name);
                        setIsOpen(false);
                      }}
                      title={name}
                    >
                      {icon}
                      <span className="icon-label">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Show categorized icons
              <>
                {Object.entries(iconCategories).map(([category, iconNames]) => (
                  <div key={category} className="icon-category">
                    <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                    <div className="icon-category-grid">
                      {icons
                        .filter(({ name }) => iconNames.includes(name))
                        .map(({ name, icon }) => (
                          <div 
                            key={name}
                            className={`icon-item ${name === selectedIcon ? 'selected' : ''}`}
                            onClick={() => {
                              onSelectIcon(name);
                              setIsOpen(false);
                            }}
                            title={name}
                          >
                            {icon}
                            <span className="icon-label">{name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                
                {/* Add Others category for dynamically generated icons */}
                {otherIcons.length > 0 && (
                  <div className="icon-category">
                    <h5>Others</h5>
                    <div className="icon-category-grid">
                      {icons
                        .filter(({ name }) => otherIcons.includes(name))
                        .slice(0, 50) // Limit to 50 icons to prevent overwhelming the UI
                        .map(({ name, icon }) => (
                          <div 
                            key={name}
                            className={`icon-item ${name === selectedIcon ? 'selected' : ''}`}
                            onClick={() => {
                              onSelectIcon(name);
                              setIsOpen(false);
                            }}
                            title={name}
                          >
                            {icon}
                            <span className="icon-label">{name}</span>
                          </div>
                        ))}
                    </div>
                    {otherIcons.length > 50 && (
                      <div className="more-icons-note">
                        <small>Showing 50 of {otherIcons.length} icons. Use search to find more.</small>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 