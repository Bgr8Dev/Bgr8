import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8CharityProps {
  stats: BusinessStats;
}

export function AdminPortalB8Charity({ stats }: AdminPortalB8CharityProps) {
  return (
    <div className="admin-section">
      <h2>B8 Charity</h2>
      <BusinessSection stats={stats} businessName="Charity" />
    </div>
  );
} 