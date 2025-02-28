import React from 'react';
import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8LeagueProps {
  stats: BusinessStats;
}

export function AdminPortalB8League({ stats }: AdminPortalB8LeagueProps) {
  return (
    <div className="admin-section">
      <h2>B8 League</h2>
      <BusinessSection stats={stats} businessName="League" />
    </div>
  );
} 