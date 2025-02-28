import React from 'react';
import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';

interface AdminPortalB8WorldProps {
  stats: { totalMembers: number; activeMembers: number; revenue: number; engagement: number };
}

export function AdminPortalB8World({ stats }: AdminPortalB8WorldProps) {
  return (
    <div className="admin-portal-page">
      <h2>B8 World Admin Panel</h2>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Participants</h3>
          <p className="stat-value">{stats.totalMembers}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Active Participants</h3>
          <p className="stat-value">{stats.activeMembers}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Donations Received</h3>
          <p className="stat-value">${stats.revenue}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Engagement Rate</h3>
          <p className="stat-value">{stats.engagement}%</p>
        </div>
      </div>

      <div className="admin-content-section">
        <h3>World Initiatives</h3>
        <div className="admin-data-table">
          <div className="admin-table-header">
            <span>Initiative Name</span>
            <span>Status</span>
            <span>Participants</span>
            <span>Last Updated</span>
          </div>
          <div className="admin-table-row">
            <span>Clean Water Project</span>
            <span>Active</span>
            <span>125</span>
            <span>Yesterday</span>
          </div>
          <div className="admin-table-row">
            <span>Education Fund</span>
            <span>Active</span>
            <span>87</span>
            <span>3 days ago</span>
          </div>
          <div className="admin-table-row">
            <span>Wildlife Conservation</span>
            <span>Planning</span>
            <span>42</span>
            <span>1 week ago</span>
          </div>
        </div>
      </div>

      <div className="admin-content-section">
        <h3>Recent Donations</h3>
        <div className="admin-data-table">
          <div className="admin-table-header">
            <span>Donor</span>
            <span>Amount</span>
            <span>Initiative</span>
            <span>Date</span>
          </div>
          <div className="admin-table-row">
            <span>Anonymous</span>
            <span>$150</span>
            <span>Clean Water Project</span>
            <span>Today</span>
          </div>
          <div className="admin-table-row">
            <span>John D.</span>
            <span>$75</span>
            <span>Education Fund</span>
            <span>Yesterday</span>
          </div>
          <div className="admin-table-row">
            <span>Sarah M.</span>
            <span>$200</span>
            <span>Wildlife Conservation</span>
            <span>3 days ago</span>
          </div>
        </div>
      </div>

      <div className="admin-content-section">
        <h3>World Partners</h3>
        <div className="admin-data-table">
          <div className="admin-table-header">
            <span>Organization</span>
            <span>Partnership Type</span>
            <span>Status</span>
            <span>Start Date</span>
          </div>
          <div className="admin-table-row">
            <span>Global Water Alliance</span>
            <span>Program</span>
            <span>Active</span>
            <span>Jan 2023</span>
          </div>
          <div className="admin-table-row">
            <span>Education First</span>
            <span>Sponsorship</span>
            <span>Active</span>
            <span>Mar 2023</span>
          </div>
          <div className="admin-table-row">
            <span>Wildlife Trust</span>
            <span>Program</span>
            <span>Pending</span>
            <span>N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
} 