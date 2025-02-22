import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8CareersProps {
  stats: BusinessStats;
}

export function AdminPortalB8Careers({ stats }: AdminPortalB8CareersProps) {
  return (
    <div className="admin-section">
      <h2>B8 Careers</h2>
      <BusinessSection stats={stats} businessName="Careers" />
    </div>
  );
} 