import React, { useMemo } from 'react';
import { FaCalendarAlt, FaClock, FaPoundSign, FaCheck } from 'react-icons/fa';
import { Booking } from '../../types/bookings';

interface BookingAnalyticsProps {
  bookings: Booking[];
}

export default function BookingAnalytics({ bookings }: BookingAnalyticsProps) {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter bookings by date
    const recentBookings = bookings.filter(booking => {
      let bookingDate: Date;
      if (booking.sessionDate instanceof Date) {
        bookingDate = booking.sessionDate;
      } else if (typeof booking.sessionDate === 'string') {
        bookingDate = new Date(booking.sessionDate);
      } else if (booking.sessionDate && typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate) {
        bookingDate = (booking.sessionDate as { toDate: () => Date }).toDate();
      } else {
        return false; // Skip bookings without valid dates
      }
      return bookingDate >= thirtyDaysAgo;
    });



    // Calculate metrics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const calComBookings = bookings.filter(b => b.isCalComBooking).length;
    const internalBookings = bookings.filter(b => !b.isCalComBooking).length;

    // Calculate completion rate
    const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    // Calculate average session duration (assuming 1 hour if not specified)
    const totalDuration = bookings.reduce((sum, booking) => {
      return sum + (booking.duration || 60); // Default to 60 minutes
    }, 0);
    const avgDuration = totalBookings > 0 ? totalDuration / totalBookings : 0;

    // Calculate revenue (if available)
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.revenue || 0);
    }, 0);

    // Monthly trends (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthBookings = bookings.filter(booking => {
        let bookingDate: Date;
        if (booking.sessionDate instanceof Date) {
          bookingDate = booking.sessionDate;
        } else if (typeof booking.sessionDate === 'string') {
          bookingDate = new Date(booking.sessionDate);
        } else if (booking.sessionDate && typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate) {
          bookingDate = (booking.sessionDate as { toDate: () => Date }).toDate();
        } else {
          return false; // Skip bookings without valid dates
        }
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      return {
        month: month.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        bookings: monthBookings.length,
        confirmed: monthBookings.filter(b => b.status === 'confirmed').length,
        revenue: monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
      };
    }).reverse();

    // Popular time slots
    const timeSlots = bookings.reduce((acc, booking) => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      const timeSlot = `${hour}:00-${hour + 1}:00`;
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTimeSlots = Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([time, count]) => ({ time, count }));

    // Top mentors by bookings
    const mentorStats = bookings.reduce((acc, booking) => {
      if (!acc[booking.mentorName]) {
        acc[booking.mentorName] = { total: 0, confirmed: 0, revenue: 0 };
      }
      acc[booking.mentorName].total++;
      if (booking.status === 'confirmed') acc[booking.mentorName].confirmed++;
      acc[booking.mentorName].revenue += booking.revenue || 0;
      return acc;
    }, {} as Record<string, { total: number; confirmed: number; revenue: number }>);

    const topMentors = Object.entries(mentorStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 5)
      .map(([name, stats]) => ({ name, ...stats }));

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      calComBookings,
      internalBookings,
      completionRate,
      avgDuration,
      totalRevenue,
      recentBookings: recentBookings.length,
      monthlyData,
      popularTimeSlots,
      topMentors
    };
  }, [bookings]);

  // Simple chart component for monthly trends
  const MonthlyChart = ({ data }: { data: Array<{ month: string; bookings: number; confirmed: number; revenue: number }> }) => {
    const maxBookings = Math.max(...data.map(d => d.bookings), 1);
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

    return (
      <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: '#ffb300', marginBottom: 16 }}>Monthly Trends</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 200, paddingTop: 20 }}>
          {data.map((month) => (
            <div key={month.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${(month.bookings / maxBookings) * 120}px`,
                    background: 'linear-gradient(to top, #ffb300, #ff6b35)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4
                  }}
                  title={`${month.bookings} bookings`}
                />
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${(month.revenue / maxRevenue) * 80}px`,
                    background: 'linear-gradient(to top, #00e676, #00c853)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4
                  }}
                  title={`£${month.revenue} revenue`}
                />
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' }}>
                {month.month}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#ffb300', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>Bookings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#00e676', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>Revenue</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#ffb300', marginBottom: 16 }}>Booking Analytics Dashboard</h2>
        <p style={{ color: '#888' }}>Comprehensive insights into booking patterns, performance metrics, and revenue tracking</p>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaCalendarAlt style={{ fontSize: 24, color: '#ffb300', marginBottom: 8 }} />
          <h3 style={{ color: '#ffb300', fontSize: 16, marginBottom: 4 }}>Total Bookings</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{analytics.totalBookings}</p>
        </div>
        
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaCheck style={{ fontSize: 24, color: '#00e676', marginBottom: 8 }} />
          <h3 style={{ color: '#00e676', fontSize: 16, marginBottom: 4 }}>Completion Rate</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{analytics.completionRate.toFixed(1)}%</p>
        </div>
        
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaPoundSign style={{ fontSize: 24, color: '#00e676', marginBottom: 8 }} />
          <h3 style={{ color: '#00e676', fontSize: 16, marginBottom: 4 }}>Total Revenue</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>£{analytics.totalRevenue}</p>
        </div>
        
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <FaClock style={{ fontSize: 24, color: '#00eaff', marginBottom: 8 }} />
          <h3 style={{ color: '#00eaff', fontSize: 16, marginBottom: 4 }}>Avg Duration</h3>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{Math.round(analytics.avgDuration)}m</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Booking Status Breakdown */}
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#ffb300', marginBottom: 16 }}>Booking Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Confirmed</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(analytics.confirmedBookings / analytics.totalBookings) * 100}%`, height: '100%', background: '#00e676' }}></div>
                </div>
                <span style={{ fontWeight: 600 }}>{analytics.confirmedBookings}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pending</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(analytics.pendingBookings / analytics.totalBookings) * 100}%`, height: '100%', background: '#ffb300' }}></div>
                </div>
                <span style={{ fontWeight: 600 }}>{analytics.pendingBookings}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cancelled</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(analytics.cancelledBookings / analytics.totalBookings) * 100}%`, height: '100%', background: '#ff4444' }}></div>
                </div>
                <span style={{ fontWeight: 600 }}>{analytics.cancelledBookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#ffb300', marginBottom: 16 }}>Platform Usage</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cal.com Bookings</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(analytics.calComBookings / analytics.totalBookings) * 100}%`, height: '100%', background: '#00eaff' }}></div>
                </div>
                <span style={{ fontWeight: 600 }}>{analytics.calComBookings}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Internal Bookings</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(analytics.internalBookings / analytics.totalBookings) * 100}%`, height: '100%', background: '#ff6b35' }}></div>
                </div>
                <span style={{ fontWeight: 600 }}>{analytics.internalBookings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: 24 }}>
        <MonthlyChart data={analytics.monthlyData} />
      </div>

      {/* Top Performers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Top Mentors */}
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#ffb300', marginBottom: 16 }}>Top Mentors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analytics.topMentors.map((mentor, index) => (
              <div key={mentor.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < analytics.topMentors.length - 1 ? '1px solid #333' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{mentor.name}</div>
                  <div style={{ fontSize: 14, color: '#888' }}>{mentor.confirmed}/{mentor.total} confirmed</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>£{mentor.revenue}</div>
                  <div style={{ fontSize: 14, color: '#888' }}>{mentor.total} bookings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Time Slots */}
        <div style={{ background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#ffb300', marginBottom: 16 }}>Popular Time Slots</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analytics.popularTimeSlots.map((slot, index) => (
              <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < analytics.popularTimeSlots.length - 1 ? '1px solid #333' : 'none' }}>
                <span>{slot.time}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(slot.count / Math.max(...analytics.popularTimeSlots.map(s => s.count))) * 100}%`, height: '100%', background: '#ffb300' }}></div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{slot.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 