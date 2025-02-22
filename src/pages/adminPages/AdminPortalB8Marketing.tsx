import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8MarketingProps {
  stats: BusinessStats;
}

export function AdminPortalB8Marketing({ stats }: AdminPortalB8MarketingProps) {
  return (
    <div className="admin-section">
      <h2>B8 Marketing</h2>
      <BusinessSection stats={stats} businessName="Marketing" />
    </div>
  );
} 