import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import { MarketingContentManager } from '../../components/admin/marketing/MarketingContentManager';
import { FaChartBar, FaPenNib } from 'react-icons/fa';
import '../../styles/adminStyles/AdminMarketing.css';

interface AdminPortalB8MarketingProps {
  stats: BusinessStats;
}

export function AdminPortalB8Marketing({ stats }: AdminPortalB8MarketingProps) {
  return (
    <div className="admin-section">
      <h2>B8 Marketing Administration</h2>
      
      {/* Business analytics section */}
      <div className="admin-panel-section">
        <div className="section-header">
          <FaChartBar className="section-icon" />
          <h3>Marketing Analytics</h3>
        </div>
        <BusinessSection stats={stats} businessName="Marketing" />
      </div>
      
      {/* Marketing content management section */}
      <div className="admin-panel-section">
        <div className="section-header">
          <FaPenNib className="section-icon" />
          <h3>Content Management</h3>
        </div>
        <p className="section-description">
          Manage all marketing content from this dashboard. Add, edit, and organize categories, 
          software tools, services, client companies, and pricing plans that will be displayed on the B8 Marketing page.
        </p>
        <MarketingContentManager />
      </div>
    </div>
  );
} 