import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8FootballClubProps {
  stats: BusinessStats;
}

export function AdminPortalB8FootballClub({ stats }: AdminPortalB8FootballClubProps) {
  return (
    <div className="admin-section">
      <h2>B8 Football Club</h2>
      <BusinessSection stats={stats} businessName="Football Club" />
    </div>
  );
} 