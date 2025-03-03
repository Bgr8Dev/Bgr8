import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import { CarClubRequests } from '../../components/admin/CarClubRequests';
import '../../styles/admin/CarClubRequests.css';

interface AdminPortalB8CarClubProps {
  stats: BusinessStats;
}

export function AdminPortalB8CarClub({ stats }: AdminPortalB8CarClubProps) {
  return (
    <div className="admin-section">
      <h2>B8 Car Club</h2>
      <BusinessSection stats={stats} businessName="Car Club" />
      
      {/* Car Club Join Requests Section */}
      <CarClubRequests />
    </div>
  );
} 