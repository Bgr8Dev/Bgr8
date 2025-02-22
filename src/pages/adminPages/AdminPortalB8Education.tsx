import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8EducationProps {
  stats: BusinessStats;
}

export function AdminPortalB8Education({ stats }: AdminPortalB8EducationProps) {
  return (
    <div className="admin-section">
      <h2>B8 Education</h2>
      <BusinessSection stats={stats} businessName="Education" />
    </div>
  );
} 