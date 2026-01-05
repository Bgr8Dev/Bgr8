import React, { useState, useEffect, useMemo } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { getDisplayName, getName, MentorMenteeProfile } from '../../widgets/MentorAlgorithm/algorithm/matchUsers';
import { CalComService, CalComBookingResponse, CalComAvailability, CalComTokenManager } from '../../widgets/MentorAlgorithm/CalCom/calComService';
import { loggers } from '../../../utils/logger';
import { Booking } from '../../../types/bookings';
import { FaSync, FaClock, FaUser, FaCalendarAlt, FaChartBar, FaCheck } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminMentorModal from './AdminMentorModal';
import '../../../styles/adminStyles/MentorManagement.css';
import BookingsTable from './BookingsTable';
import BookingDetailsModal from './BookingDetailsModal';
import BookingsGrouped from './BookingsGrouped';



// Add Availability interfaces for admin view
interface TimeSlot {
  id: string;
  day?: string; // For recurring
  date?: string; // For specific date (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  type: 'recurring' | 'specific';
}

interface MentorAvailability {
  mentorId: string;
  timeSlots: TimeSlot[];
  lastUpdated: Date;
}

interface MentorAvailabilityWithProfile extends MentorAvailability {
  mentorProfile?: MentorMenteeProfile;
  calComAvailability?: CalComAvailability[];
  hasCalComIntegration?: boolean;
}

interface MentorMenteeProfileWithId extends MentorMenteeProfile {
  id: string;
  isGenerated?: boolean;
}

type FirestoreTimestamp = { toDate: () => Date };
function isFirestoreTimestamp(val: unknown): val is FirestoreTimestamp {
  return !!val && typeof val === 'object' && typeof (val as { toDate?: unknown }).toDate === 'function';
}

// Extend the Booking interface to include generated properties
interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
  bookingMethod?: string;
}

// Enhanced BookingAnalytics component with charts and tables
const BookingAnalytics = ({ bookings }: { bookings: Booking[] }) => {
  const analytics = useMemo(() => {
    const calComBookings = bookings.filter(b => b.isCalComBooking);
    const totalBookings = calComBookings.length;
    const confirmedBookings = calComBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = calComBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = calComBookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    
    // Get unique mentors and mentees
    const uniqueMentors = new Set(calComBookings.map(b => b.mentorId)).size;
    const uniqueMentees = new Set(calComBookings.map(b => b.menteeId)).size;
    
    // Top mentors by bookings
    const mentorStats = new Map<string, { name: string; bookings: number }>();
    calComBookings.forEach(booking => {
      const existing = mentorStats.get(booking.mentorId) || { name: booking.mentorName, bookings: 0 };
      existing.bookings += 1;
      mentorStats.set(booking.mentorId, existing);
    });
    const topMentors = Array.from(mentorStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);
    
    // Top mentees by bookings
    const menteeStats = new Map<string, { name: string; bookings: number }>();
    calComBookings.forEach(booking => {
      const existing = menteeStats.get(booking.menteeId) || { name: booking.menteeName, bookings: 0 };
      existing.bookings += 1;
      menteeStats.set(booking.menteeId, existing);
    });
    const topMentees = Array.from(menteeStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);
    
    // Monthly trends
    const monthlyData = new Map<string, { bookings: number; confirmed: number }>();
    calComBookings.forEach(booking => {
      if (!booking.sessionDate) return;
      let date: Date;
      if (booking.sessionDate instanceof Date) {
        date = booking.sessionDate;
      } else if (isFirestoreTimestamp(booking.sessionDate)) {
        date = booking.sessionDate.toDate();
      } else {
        date = new Date(booking.sessionDate);
      }
      if (isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { bookings: 0, confirmed: 0 };
      existing.bookings += 1;
      if (booking.status === 'confirmed') existing.confirmed += 1;
      monthlyData.set(monthKey, existing);
    });
    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        bookings: data.bookings,
        confirmed: data.confirmed
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Status breakdown for pie chart
    const statusData = [
      { name: 'Confirmed', value: confirmedBookings, color: '#5b8a7a' },
      { name: 'Pending', value: pendingBookings, color: '#b8956a' },
      { name: 'Cancelled', value: cancelledBookings, color: '#8b6f6f' }
    ];
    
    // Recent bookings (last 10)
    const recentBookings = [...calComBookings]
      .filter(booking => booking.sessionDate)
      .sort((a, b) => {
        if (!a.sessionDate || !b.sessionDate) return 0;
        const dateA = a.sessionDate instanceof Date ? a.sessionDate : 
                     isFirestoreTimestamp(a.sessionDate) ? a.sessionDate.toDate() : new Date(a.sessionDate);
        const dateB = b.sessionDate instanceof Date ? b.sessionDate :
                     isFirestoreTimestamp(b.sessionDate) ? b.sessionDate.toDate() : new Date(b.sessionDate);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completionRate,
      uniqueMentors,
      uniqueMentees,
      topMentors,
      topMentees,
      monthlyTrends,
      statusData,
      recentBookings
    };
  }, [bookings]);

  return (
    <div style={{ padding: '32px', background: '#0f0f0f', minHeight: '100vh' }}>
      <h2 style={{ color: '#e8e8e8', marginBottom: 32, fontSize: 32, fontWeight: 300, letterSpacing: '0.5px' }}>Booking Analytics Dashboard</h2>
      
      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          textAlign: 'center', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <FaCalendarAlt style={{ fontSize: 22, color: '#a8a8a8', marginBottom: 12, opacity: 0.8 }} />
          <h3 style={{ color: '#b8b8b8', fontSize: 13, marginBottom: 8, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Bookings</h3>
          <p style={{ fontSize: 32, fontWeight: 300, margin: 0, color: '#e8e8e8', letterSpacing: '-0.5px' }}>{analytics.totalBookings}</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          textAlign: 'center', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <FaCheck style={{ fontSize: 22, color: '#a8a8a8', marginBottom: 12, opacity: 0.8 }} />
          <h3 style={{ color: '#b8b8b8', fontSize: 13, marginBottom: 8, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Completion Rate</h3>
          <p style={{ fontSize: 32, fontWeight: 300, margin: 0, color: '#e8e8e8', letterSpacing: '-0.5px' }}>{analytics.completionRate.toFixed(1)}%</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          textAlign: 'center', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <FaUser style={{ fontSize: 22, color: '#a8a8a8', marginBottom: 12, opacity: 0.8 }} />
          <h3 style={{ color: '#b8b8b8', fontSize: 13, marginBottom: 8, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Mentors</h3>
          <p style={{ fontSize: 32, fontWeight: 300, margin: 0, color: '#e8e8e8', letterSpacing: '-0.5px' }}>{analytics.uniqueMentors}</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          textAlign: 'center', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <FaUser style={{ fontSize: 22, color: '#a8a8a8', marginBottom: 12, opacity: 0.8 }} />
          <h3 style={{ color: '#b8b8b8', fontSize: 13, marginBottom: 8, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Mentees</h3>
          <p style={{ fontSize: 32, fontWeight: 300, margin: 0, color: '#e8e8e8', letterSpacing: '-0.5px' }}>{analytics.uniqueMentees}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Monthly Trends Line Chart */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Monthly Booking Trends</h3>
          {analytics.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15,15,15,0.95)', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '6px', 
                    color: '#e8e8e8',
                    padding: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ color: '#b8b8b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="bookings" stroke="#7a9fb5" strokeWidth={2.5} name="Total Bookings" dot={{ fill: '#7a9fb5', r: 3 }} />
                <Line type="monotone" dataKey="confirmed" stroke="#5b8a7a" strokeWidth={2.5} name="Confirmed" dot={{ fill: '#5b8a7a', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: 60, fontSize: 14 }}>No booking data available</div>
          )}
        </div>

        {/* Status Breakdown Pie Chart */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Booking Status</h3>
          {analytics.statusData.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15,15,15,0.95)', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '6px', 
                    color: '#e8e8e8',
                    padding: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: 60, fontSize: 14 }}>No booking data available</div>
          )}
        </div>
      </div>

      {/* Top Mentors Bar Chart */}
      {analytics.topMentors.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          marginBottom: 32, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Top 10 Mentors by Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topMentors.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15,15,15,0.95)', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  borderRadius: '6px', 
                  color: '#e8e8e8',
                  padding: '12px'
                }} 
              />
              <Legend wrapperStyle={{ color: '#b8b8b8', fontSize: '12px' }} />
              <Bar dataKey="bookings" fill="#7a9fb5" name="Bookings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Top Mentors Table */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Top Mentors</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mentor</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topMentors.slice(0, 10).map((mentor, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 12px', color: '#d8d8d8', fontSize: 14 }}>{mentor.name}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', color: '#d8d8d8', fontSize: 14 }}>{mentor.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Mentees Table */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Top Mentees</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mentee</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topMentees.slice(0, 10).map((mentee, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 12px', color: '#d8d8d8', fontSize: 14 }}>{mentee.name}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', color: '#d8d8d8', fontSize: 14 }}>{mentee.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      {analytics.recentBookings.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', 
          borderRadius: 8, 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#d0d0d0', marginBottom: 20, fontSize: 16, fontWeight: 400, letterSpacing: '0.5px' }}>Recent Bookings</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mentor</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mentee</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', color: '#a8a8a8', fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentBookings.map((booking, idx) => {
                  if (!booking.sessionDate) return null;
                  const date = booking.sessionDate instanceof Date ? booking.sessionDate :
                              isFirestoreTimestamp(booking.sessionDate) ? booking.sessionDate.toDate() :
                              new Date(booking.sessionDate);
                  const statusColor = booking.status === 'confirmed' ? '#5b8a7a' :
                                    booking.status === 'pending' ? '#b8956a' : '#8b6f6f';
                  const statusTextColor = booking.status === 'confirmed' ? '#e8e8e8' :
                                         booking.status === 'pending' ? '#e8e8e8' : '#e8e8e8';
                  if (isNaN(date.getTime())) return null;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 12px', color: '#d8d8d8', fontSize: 14 }}>
                        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#d8d8d8', fontSize: 14 }}>{booking.mentorName}</td>
                      <td style={{ padding: '14px 12px', color: '#d8d8d8', fontSize: 14 }}>{booking.menteeName}</td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <span style={{ 
                          background: statusColor, 
                          color: statusTextColor, 
                          padding: '5px 14px', 
                          borderRadius: '4px', 
                          fontWeight: 500,
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MentorManagement() {
  const [users, setUsers] = useState<MentorMenteeProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<MentorMenteeProfileWithId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<'users' | 'bookings' | 'availability' | 'analytics'>('users');
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  // Bookings view mode
  const [bookingsView, setBookingsView] = useState<'table' | 'grouped'>('table');
  const [groupBy, setGroupBy] = useState<'mentor' | 'mentee'>('mentor');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<MentorAvailabilityWithProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Add new state for booking filters
  const [bookingGeneratedFilter, setBookingGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');
  const [bookingMethodFilter, setBookingMethodFilter] = useState<'all' | 'calcom'>('all');
  // Availability state
  const [availabilityData, setAvailabilityData] = useState<MentorAvailabilityWithProfile[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilitySearch, setAvailabilitySearch] = useState('');

  // Add state for sorting and searching
  const [userSortField, setUserSortField] = useState<'name' | 'type' | 'email' | 'profession' | 'education' | 'county'>('name');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('asc');
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [userGeneratedFilter, setUserGeneratedFilter] = useState<'all' | 'generated' | 'real'>('all');

  // Stat tile hover state
  const [hoveredTile, setHoveredTile] = useState<'total' | 'mentors' | 'mentees' | null>(null);

  // Calculate counts
  const realUsers = users.filter(u => !u.isGenerated);
  const generatedUsers = users.filter(u => u.isGenerated);
  const realMentors = realUsers.filter(u => u.isMentor);
  const generatedMentors = generatedUsers.filter(u => u.isMentor);
  const realMentees = realUsers.filter(u => u.isMentee);
  const generatedMentees = generatedUsers.filter(u => u.isMentee);

  // Fetch users from mentorProgram subcollections and generated collections
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers: MentorMenteeProfileWithId[] = [];
      
      // Get all users and check their mentorProgram subcollections (original profiles)
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      console.log(`Found ${usersSnapshot.docs.length} users in users collection`);
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            // Check if this profile has the isGenerated flag set to true
            const isGenerated = userData.isGenerated === true;
            
            // Determine the user type - check both isMentor/isMentee and type fields
            let userType = 'unknown';
            if (userData.isMentor === true) {
              userType = 'MENTOR';
            } else if (userData.isMentee === true) {
              userType = 'MENTEE';
            } else if (userData.type) {
              userType = userData.type.toUpperCase();
            }
            
            console.log(`User ${userDoc.id} (${userData.name}): isGenerated = ${isGenerated}, isMentor = ${userData.isMentor}, isMentee = ${userData.isMentee}, type = ${userData.type}, resolved type = ${userType}`);
            
            allUsers.push({
              ...userData,
              id: userDoc.id,
              isGenerated: isGenerated, // Use the actual flag from the profile data
              type: userType // Ensure we have the correct type
            } as unknown as MentorMenteeProfileWithId);
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch generated mentors from "Generated Mentors" collection
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        console.log(`Found ${generatedMentorsSnapshot.docs.length} generated mentors`);
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          // Ensure generated mentors have the correct type
          const userType = mentorData.isMentor === true ? 'MENTOR' : 
                          mentorData.isMentee === true ? 'MENTEE' : 
                          mentorData.type ? mentorData.type.toUpperCase() : 'MENTOR';
          
          console.log(`Generated Mentor ${doc.id}: ${mentorData.name}, type = ${userType}`);
          allUsers.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true, // Mark as generated profile
            type: userType // Ensure correct type
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees from "Generated Mentees" collection
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        console.log(`Found ${generatedMenteesSnapshot.docs.length} generated mentees`);
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          // Ensure generated mentees have the correct type
          const userType = menteeData.isMentor === true ? 'MENTOR' : 
                          menteeData.isMentee === true ? 'MENTEE' : 
                          menteeData.type ? menteeData.type.toUpperCase() : 'MENTEE';
          
          console.log(`Generated Mentee ${doc.id}: ${menteeData.name}, type = ${userType}`);
          allUsers.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true, // Mark as generated profile
            type: userType // Ensure correct type
          } as unknown as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
      }
      
      console.log(`Total users loaded: ${allUsers.length}`);
      console.log(`Real users: ${allUsers.filter(u => !u.isGenerated).length}`);
      console.log(`Generated users: ${allUsers.filter(u => u.isGenerated).length}`);
      console.log(`Real mentors: ${allUsers.filter(u => !u.isGenerated && u.isMentor).length}`);
      console.log(`Generated mentors: ${allUsers.filter(u => u.isGenerated && u.isMentor).length}`);
      console.log(`Real mentees: ${allUsers.filter(u => !u.isGenerated && u.isMentee).length}`);
      console.log(`Generated mentees: ${allUsers.filter(u => u.isGenerated && u.isMentee).length}`);
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetchBookings function that includes Cal.com bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const results: Booking[] = [];
      
      // Fetch Firestore bookings (only Cal.com bookings - internal system removed)
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('isCalComBooking', '==', true)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const firestoreBookings = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          mentorName: data.mentorName || 'Unknown',
          mentorEmail: data.mentorEmail || 'No email',
          menteeName: data.menteeName || 'Unknown',
          menteeEmail: data.menteeEmail || 'No email',
          sessionDate: data.sessionDate,
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || 'pending',
          meetLink: data.meetLink,
          eventId: data.eventId,
          mentorId: data.mentorId,
          menteeId: data.menteeId,
          createdAt: data.createdAt,
          duration: data.duration || 60,
          revenue: data.revenue || 0,
          isCalComBooking: data.isCalComBooking || false,
          // Add new fields for enhanced booking data
          day: data.day || '',
          calComBookingId: data.calComBookingId || null,
          calComEventType: data.calComEventType || null,
          calComAttendees: data.calComAttendees || [],
          bookingMethod: data.bookingMethod || 'internal',
          // Add generated profile detection
          isGeneratedMentor: false, // Will be set below
          isGeneratedMentee: false, // Will be set below
        } as Booking;
      });
      results.push(...firestoreBookings);

      // Fetch Cal.com bookings from all mentors
      try {
        // Get all users and check their mentorProgram subcollections for mentors
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const mentorPromises: Promise<Booking[]>[] = [];
        
        for (const userDoc of usersSnapshot.docs) {
          try {
            const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
            if (mentorProgramDoc.exists()) {
              const mentorData = mentorProgramDoc.data();
              if (mentorData.isMentor) {
                const mentorPromise = (async () => {
                  try {
                    // Check if mentor has Cal.com API key before attempting to fetch bookings
                    const hasApiKey = await CalComTokenManager.hasApiKey(userDoc.id);
                    if (!hasApiKey) {
                      // Mentor doesn't have Cal.com integration - skip silently
                      return [];
                    }
                    
                    const calComBookings = await CalComService.getBookings(userDoc.id);
                    return calComBookings.map((calBooking: CalComBookingResponse) => {
                      const startDate = new Date(calBooking.startTime);
                      const endDate = new Date(calBooking.endTime);
                      
                      // Find mentor and mentee from attendees
                      const mentor = calBooking.attendees.find(attendee => 
                        attendee.email === mentorData.email
                      );
                      const mentee = calBooking.attendees.find(attendee => 
                        attendee.email !== mentorData.email
                      );
                      
                      return {
                        id: `calcom-${calBooking.id}`,
                        mentorId: userDoc.id,
                        menteeId: mentee?.email || 'unknown',
                        mentorName: mentor?.name || mentorData.name || 'Unknown Mentor',
                        menteeName: mentee?.name || 'Unknown Mentee',
                        mentorEmail: mentor?.email || mentorData.email || '',
                        menteeEmail: mentee?.email || '',
                        sessionDate: Timestamp.fromDate(startDate),
                        startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        status: calBooking.status === 'ACCEPTED' ? 'confirmed' : 
                                calBooking.status === 'PENDING' ? 'pending' : 'cancelled',
                        createdAt: Timestamp.fromDate(new Date()), // Cal.com bookings do not have Firestore Timestamp, set to null or undefined
                        duration: (calBooking.eventType as { length?: number; price?: number })?.length || 60,
                        revenue: (calBooking.eventType as { length?: number; price?: number })?.price || 0,
                        isCalComBooking: true,
                        calComBookingId: calBooking.id,
                        calComEventType: calBooking.eventType,
                        calComAttendees: calBooking.attendees,
                        // Add new fields for enhanced booking data
                        day: '', // Cal.com doesn't have day field
                        meetLink: '',
                        eventId: calBooking.id,
                        bookingMethod: 'calcom',
                        // Add generated profile detection
                        isGeneratedMentor: false, // Will be set below
                        isGeneratedMentee: false, // Will be set below
                      } as Booking;
                    });
                  } catch (error) {
                    // Only log unexpected errors, not missing API keys (which are handled above)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (!errorMessage.includes('No Cal.com API key')) {
                      loggers.api.error(`Error fetching Cal.com bookings for mentor ${userDoc.id}:`, error);
                    }
                    return [];
                  }
                })();
                mentorPromises.push(mentorPromise);
              }
            }
          } catch (error) {
            loggers.api.error(`Error checking mentor program for user ${userDoc.id}:`, error);
          }
        }
        
        const calComResults = await Promise.all(mentorPromises);
        const allCalComBookings = calComResults.flat();
        results.push(...allCalComBookings);
      } catch (error) {
        loggers.api.error('Error fetching Cal.com bookings:', error);
        // Continue with Firestore bookings only
      }

      // Now enrich all bookings with generated profile information
      const enrichedBookings = await Promise.all(
        results.map(async (booking) => {
          try {
            // Check if mentor is generated by looking at the actual profile data
            let isGeneratedMentor = false;
            try {
              // First check if it's a generated mentor by looking in the Generated Mentors collection
              const generatedMentorDoc = await getDoc(doc(firestore, 'Generated Mentors', booking.mentorId));
              if (generatedMentorDoc.exists()) {
                console.log(`Mentor ${booking.mentorId} found in Generated Mentors collection`);
                isGeneratedMentor = true;
              } else {
                // If not in generated collection, check if it's a real user profile
                const mentorProfileDoc = await getDoc(doc(firestore, 'users', booking.mentorId, 'mentorProgram', 'profile'));
                if (mentorProfileDoc.exists()) {
                  const mentorData = mentorProfileDoc.data();
                  // Check if the profile has the isGenerated flag set to true
                  isGeneratedMentor = mentorData.isGenerated === true;
                  console.log(`Mentor ${booking.mentorId} profile data:`, { 
                    isGenerated: mentorData.isGenerated, 
                    name: mentorData.name,
                    type: mentorData.type 
                  });
                } else {
                  console.log(`Mentor ${booking.mentorId} not found in any collection`);
                }
              }
            } catch (error) {
              console.error(`Error checking mentor profile for ${booking.mentorId}:`, error);
              isGeneratedMentor = false;
            }

            // Check if mentee is generated by looking at the actual profile data
            let isGeneratedMentee = false;
            try {
              // First check if it's a generated mentee by looking in the Generated Mentees collection
              const generatedMenteeDoc = await getDoc(doc(firestore, 'Generated Mentees', booking.menteeId));
              if (generatedMenteeDoc.exists()) {
                console.log(`Mentee ${booking.menteeId} found in Generated Mentees collection`);
                isGeneratedMentee = true;
              } else {
                // If not in generated collection, check if it's a real user profile
                const menteeProfileDoc = await getDoc(doc(firestore, 'users', booking.menteeId, 'mentorProgram', 'profile'));
                if (menteeProfileDoc.exists()) {
                  const menteeData = menteeProfileDoc.data();
                  // Check if the profile has the isGenerated flag set to true
                  isGeneratedMentee = menteeData.isGenerated === true;
                  console.log(`Mentee ${booking.menteeId} profile data:`, { 
                    isGenerated: menteeData.isGenerated, 
                    name: menteeData.name,
                    type: menteeData.type 
                  });
                } else {
                  console.log(`Mentee ${booking.menteeId} not found in any collection`);
                }
              }
            } catch (error) {
              console.error(`Error checking mentee profile for ${booking.menteeId}:`, error);
              isGeneratedMentee = false;
            }

            console.log(`Booking ${booking.id} enriched:`, { 
              mentorId: booking.mentorId, 
              menteeId: booking.menteeId,
              isGeneratedMentor, 
              isGeneratedMentee 
            });

            return {
              ...booking,
              isGeneratedMentor,
              isGeneratedMentee,
            };
          } catch (error) {
            console.error(`Error enriching booking ${booking.id}:`, error);
            return {
              ...booking,
              isGeneratedMentor: false,
              isGeneratedMentee: false,
            };
          }
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookingsError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch availability data when tab is switched to 'availability'
  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      // Get all users and check their mentorProgram subcollections (new structure)
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData: MentorMenteeProfileWithId[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
          if (mentorProgramDoc.exists()) {
            const userData = mentorProgramDoc.data();
            usersData.push({
              ...userData,
              id: userDoc.id,
              isGenerated: false
            } as MentorMenteeProfileWithId);
          }
        } catch (error) {
          console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
        }
      }
      
      // Fetch generated mentors from "Generated Mentors" collection
      try {
        const generatedMentorsSnapshot = await getDocs(collection(firestore, 'Generated Mentors'));
        generatedMentorsSnapshot.docs.forEach(doc => {
          const mentorData = doc.data();
          usersData.push({
            ...mentorData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentors:', error);
      }
      
      // Fetch generated mentees from "Generated Mentees" collection
      try {
        const generatedMenteesSnapshot = await getDocs(collection(firestore, 'Generated Mentees'));
        generatedMenteesSnapshot.docs.forEach(doc => {
          const menteeData = doc.data();
          usersData.push({
            ...menteeData,
            id: doc.id,
            isGenerated: true
          } as MentorMenteeProfileWithId);
        });
      } catch (error) {
        console.error('Error fetching generated mentees:', error);
      }
      
             // Fetch availability data from users/{uid}/availabilities subcollections
       const availabilityPromises = usersData.map(async (user) => {
         try {
           const availabilityDoc = await getDoc(doc(firestore, 'users', user.id, 'availabilities', 'default'));
           if (availabilityDoc.exists()) {
             const availabilityData = availabilityDoc.data();
             return {
               ...availabilityData,
               mentorId: user.id
             } as MentorAvailabilityWithProfile;
           }
           return null;
         } catch (error) {
           console.error(`Error fetching availability for user ${user.id}:`, error);
           return null;
         }
       });
       
       const availabilityResults = await Promise.all(availabilityPromises);
       const allAvailabilityData = availabilityResults.filter(Boolean) as MentorAvailabilityWithProfile[];
       
       // Fetch mentor profiles and Cal.com availability to enrich the data
       const enrichedData = await Promise.all(
         allAvailabilityData.map(async (availability) => {
          try {
            // Fetch mentor profile from the new structure
            let mentorProfile: MentorMenteeProfile | undefined;
            
            // Try to get from users/{uid}/mentorProgram/profile first
            try {
              const mentorDoc = await getDoc(doc(firestore, 'users', availability.mentorId, 'mentorProgram', 'profile'));
              if (mentorDoc.exists()) {
                mentorProfile = mentorDoc.data() as MentorMenteeProfile;
              }
            } catch {
              // If that fails, try the old structure
              try {
                const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', availability.mentorId));
                if (mentorDoc.exists()) {
                  mentorProfile = mentorDoc.data() as MentorMenteeProfile;
                }
              } catch (oldError) {
                console.error(`Error fetching mentor profile for ${availability.mentorId}:`, oldError);
              }
            }
            
            if (mentorProfile) {
              availability.mentorProfile = mentorProfile;
            }
            
            // Check if mentor has Cal.com integration
            const hasCalComApiKey = await CalComTokenManager.hasApiKey(availability.mentorId);
            availability.hasCalComIntegration = hasCalComApiKey;
            
            // Fetch Cal.com availability if mentor has integration
            if (hasCalComApiKey) {
              try {
                // Get availability for next 7 days
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                
                const dateFrom = today.toISOString().split('T')[0];
                const dateTo = nextWeek.toISOString().split('T')[0];
                
                const calComAvailability = await CalComService.getAvailability(
                  availability.mentorId,
                  dateFrom,
                  dateTo
                );
                
                availability.calComAvailability = calComAvailability;
              } catch (calComError) {
                console.error(`Error fetching Cal.com availability for mentor ${availability.mentorId}:`, calComError);
                // Don't fail the entire request if Cal.com fails
              }
            }
          } catch (err) {
            console.error(`Error fetching mentor profile for ${availability.mentorId}:`, err);
          }
          return availability;
        })
      );
      
      setAvailabilityData(enrichedData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailabilityError('Failed to load availability data');
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch bookings when tab is switched to 'bookings' or 'analytics'
  useEffect(() => {
    if (tab === 'bookings' || tab === 'analytics') {
      fetchBookings();
    }
  }, [tab]);

  // Only fetch availability when tab is switched to 'availability'
  useEffect(() => {
    if (tab === 'availability') {
      fetchAvailability();
    }
  }, [tab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = async (user: MentorMenteeProfileWithId) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${user.name} (${user.type})? This will also remove all their availability data and bookings. This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      // Delete the user profile - check if it's generated or real
      if (user.isGenerated) {
        // Delete from Generated Mentors or Generated Mentees collection
        const collectionName = user.isMentor ? 'Generated Mentors' : 'Generated Mentees';
        await deleteDoc(doc(firestore, collectionName, user.id));
      } else {
        // Delete from users collection subcollection
        await deleteDoc(doc(firestore, 'users', user.id, 'mentorProgram', 'profile'));
        
        // Delete all availability data for this user from subcollections
              try {
                await deleteDoc(doc(firestore, 'users', user.id, 'availabilities', 'default'));
              } catch {
                // Ignore if it doesn't exist
                console.log(`No availability data found for user ${user.id}`);
              }
      }
      
      // Delete all bookings for this user (as mentor or mentee)
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', user.id)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingDeletions = bookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(bookingDeletions);
      
      // Also check if they're a mentee in any bookings
      const menteeBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('menteeId', '==', user.id)
      );
      const menteeBookingsSnapshot = await getDocs(menteeBookingsQuery);
      const menteeBookingDeletions = menteeBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(menteeBookingDeletions);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteStatus(`Deleted ${user.name} and all related data successfully.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteStatus('Failed to delete user and related data.');
    }
  };

  const handleEditUser = (user: MentorMenteeProfileWithId) => {
    setEditUser(user);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedUser: MentorMenteeProfile) => {
    if (!editUser) return;
    setDeleteStatus(null);
    try {
      // Update Firestore
      await setDoc(doc(firestore, 'users', editUser.id, 'mentorProgram', 'profile'), updatedUser);
      // Update local state
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...updatedUser, id: editUser.id } : u));
      setEditModalOpen(false);
      setEditUser(null);
      setDeleteStatus(`Updated ${updatedUser.name} successfully.`);
    } catch {
      setDeleteStatus('Failed to update user.');
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected user(s)? This will also remove all their availability data and bookings. This cannot be undone.`);
    if (!confirmed) return;
    setDeleteStatus(null);
    try {
      // Get the user objects to check if they're generated
      const selectedUsers = users.filter(u => selectedIds.includes(u.id));
      
      // Separate generated and real users
      const generatedUsers = selectedUsers.filter(u => u.isGenerated);
      const realUsers = selectedUsers.filter(u => !u.isGenerated);
      
      // Delete generated profiles from their respective collections
      const generatedProfileDeletions = generatedUsers.map(user => {
        const collectionName = user.isMentor ? 'Generated Mentors' : 'Generated Mentees';
        return deleteDoc(doc(firestore, collectionName, user.id));
      });
      await Promise.all(generatedProfileDeletions);
      
      // Delete real user profiles from users collection
      const realProfileDeletions = realUsers.map(user => 
        deleteDoc(doc(firestore, 'users', user.id, 'mentorProgram', 'profile'))
      );
      await Promise.all(realProfileDeletions);
      
      // Delete all availability data for real users from subcollections
      const realAvailabilityDeletions = realUsers.map(user => 
        deleteDoc(doc(firestore, 'users', user.id, 'availabilities', 'default')).catch(() => {
          // Ignore if it doesn't exist
          console.log(`No availability data found for user ${user.id}`);
        })
      );
      await Promise.all(realAvailabilityDeletions);
      
      // Delete all bookings for these users (as mentors or mentees)
      // Firebase 'in' queries are limited to 10 items, so we need to batch them
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Delete mentor bookings in batches
      for (const batch of batches) {
        const mentorBookingsQuery = query(
          collection(firestore, 'bookings'),
          where('mentorId', 'in', batch)
        );
        const mentorBookingsSnapshot = await getDocs(mentorBookingsQuery);
        const mentorBookingDeletions = mentorBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(mentorBookingDeletions);
      }
      
      // Delete mentee bookings in batches
      for (const batch of batches) {
        const menteeBookingsQuery = query(
          collection(firestore, 'bookings'),
          where('menteeId', 'in', batch)
        );
        const menteeBookingsSnapshot = await getDocs(menteeBookingsQuery);
        const menteeBookingDeletions = menteeBookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(menteeBookingDeletions);
      }
      
      // Save count before clearing
      const deletedCount = selectedIds.length;
      
      // Update local state
      setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      setDeleteStatus(`Deleted ${deletedCount} user(s) and all related data successfully.`);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      setDeleteStatus('Failed to delete selected users and related data.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
      const matchesGenerated = userGeneratedFilter === 'all' || 
        (userGeneratedFilter === 'generated' && user.isGenerated) ||
        (userGeneratedFilter === 'real' && !user.isGenerated);
      const s = userSearch.toLowerCase();
      const matchesSearch =
        s === '' ||
        (getName(user).toLowerCase() ?? '').includes(s) ||
        (user.email?.toLowerCase() ?? '').includes(s) ||
        (user.profession?.toLowerCase() ?? '').includes(s);
      return matchesType && matchesGenerated && matchesSearch;
    });
  }, [users, userTypeFilter, userGeneratedFilter, userSearch]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let vA: string | undefined, vB: string | undefined;
      if (userSortField === 'name') {
        vA = getName(a).toLowerCase(); vB = getName(b).toLowerCase();
      } else if (userSortField === 'type') {
        vA = a.type as string; vB = b.type as string;
      } else if (userSortField === 'email') {
        vA = a.email?.toLowerCase(); vB = b.email?.toLowerCase();
      } else if (userSortField === 'profession') {
        vA = a.profession?.toLowerCase(); vB = b.profession?.toLowerCase();
      } else if (userSortField === 'education') {
        vA = a.educationLevel; vB = b.educationLevel;
      } else if (userSortField === 'county') {
        vA = a.county; vB = b.county;
      }
      if (vA === undefined || vB === undefined) return 0;
      return userSortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });
  }, [filteredUsers, userSortField, userSortDir]);

  // Filter and sort availability data
  const filteredAvailability = useMemo(() => {
    return availabilityData.filter(availability => {
      const mentorName = availability.mentorProfile ? getName(availability.mentorProfile).toLowerCase() : ''
      const mentorEmail = availability.mentorProfile?.email?.toLowerCase() || '';
      const searchTerm = availabilitySearch.toLowerCase();
      
      // Filter by search term
      if (searchTerm && !mentorName.includes(searchTerm) && !mentorEmail.includes(searchTerm)) {
        return false;
      }
      
      return true;
    });
  }, [availabilityData, availabilitySearch]);

  // Filter and sort bookings data
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const extendedBooking = booking as ExtendedBooking;
      
      // Filter by generated profile status
      if (bookingGeneratedFilter !== 'all') {
        const hasGeneratedProfile = extendedBooking.isGeneratedMentor || extendedBooking.isGeneratedMentee;
        if (bookingGeneratedFilter === 'generated' && !hasGeneratedProfile) return false;
        if (bookingGeneratedFilter === 'real' && hasGeneratedProfile) return false;
      }
      
      // Filter by booking method (only Cal.com bookings now - internal system removed)
      // Only show Cal.com bookings
      if (!extendedBooking.isCalComBooking) return false;
      
      if (bookingMethodFilter !== 'all') {
        const method = extendedBooking.bookingMethod || 'calcom';
        if (method !== bookingMethodFilter) return false;
      }
      
      return true;
    });
  }, [bookings, bookingGeneratedFilter, bookingMethodFilter]);

  // Admin action handlers
  const handleDeleteBooking = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(firestore, 'bookings', booking.id));
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateBookingStatus = async (booking: Booking, status: 'confirmed' | 'cancelled') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), { status });
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
      setDetailsModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions for availability display
  const getMentorName = (availability: MentorAvailabilityWithProfile) => {
    return getDisplayName(availability.mentorProfile, availability.mentorId)
  };

  const getMentorEmail = (availability: MentorAvailabilityWithProfile) => {
    return availability.mentorProfile?.email || 'No email';
  };

  // Cal.com availability helper functions
  const getCalComTotalSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => total + day.slots.length, 0);
  };

  const getCalComAvailableSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => 
      total + day.slots.filter(slot => slot.available).length, 0);
  };

  const getCalComBookedSlots = (availability: MentorAvailabilityWithProfile) => {
    if (!availability.calComAvailability) return 0;
    return availability.calComAvailability.reduce((total, day) => 
      total + day.slots.filter(slot => !slot.available).length, 0);
  };


  // Booking statistics helper functions
  const getBookingStats = () => {
    // Only count Cal.com bookings (internal booking system removed)
    const calComBookings = bookings.filter(b => b.isCalComBooking);
    const totalBookings = calComBookings.length;
    const confirmedBookings = calComBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = calComBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = calComBookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = calComBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);
    const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    
    // Get unique mentors and mentees
    const uniqueMentors = new Set(bookings.map(b => b.mentorId)).size;
    const uniqueMentees = new Set(bookings.map(b => b.menteeId)).size;
    
    // Get today's bookings
    const today = new Date();
    const todayBookings = bookings.filter(b => {
      const bookingDate =
        b.sessionDate instanceof Date
          ? b.sessionDate
          : isFirestoreTimestamp(b.sessionDate)
          ? b.sessionDate.toDate()
          : b.sessionDate
          ? new Date(b.sessionDate)
          : new Date('');
      return bookingDate.toDateString() === today.toDateString();
    }).length;
    
    // Get this week's bookings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const thisWeekBookings = bookings.filter(b => {
      const bookingDate =
        b.sessionDate instanceof Date
          ? b.sessionDate
          : isFirestoreTimestamp(b.sessionDate)
          ? b.sessionDate.toDate()
          : b.sessionDate
          ? new Date(b.sessionDate)
          : new Date('');
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      calComBookings: totalBookings, // All bookings are Cal.com now
      totalRevenue,
      completionRate,
      uniqueMentors,
      uniqueMentees,
      todayBookings,
      thisWeekBookings
    };
  };

  if (loading) {
    return <div className="mentor-management-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="mentor-management-error">{error}</div>;
  }

  return (
    <div className="mentor-management">
      {/* Tab Switcher */}
      <div className="mentor-management-tabs">
        <button className={`tab-button ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <FaUser className="tab-icon" />
          Users
        </button>
        <button className={`tab-button ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>
          <FaCalendarAlt className="tab-icon" />
          Bookings
        </button>
        <button className={`tab-button ${tab === 'availability' ? 'active' : ''}`} onClick={() => setTab('availability')}>
          <FaClock className="tab-icon" />
          Availability
        </button>
        <button className={`tab-button ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
          <FaChartBar className="tab-icon" />
          Analytics
        </button>
      </div>
      
      {/* USERS TAB */}
      {tab === 'users' && (
        <>
          <div className="mentor-management-header">
            <h2>Mentor Program Management</h2>
            <div className="mentor-management-controls">
              {/* In the users tab, add search and filter controls above the table */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name, email, or profession..." style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} />
                <select value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value as 'all' | 'mentor' | 'mentee')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Types</option>
                  <option value="mentor">Mentor</option>
                  <option value="mentee">Mentee</option>
                </select>
                <select value={userGeneratedFilter} onChange={e => setUserGeneratedFilter(e.target.value as 'all' | 'generated' | 'real')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
                  <option value="all">All Profiles</option>
                  <option value="real">Real Profiles</option>
                  <option value="generated">Generated Profiles</option>
                </select>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  🎲 = Generated Profile
                </div>
              </div>
              <div className="mentor-management-filters">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={filter === 'mentor' ? 'active' : ''}
                  onClick={() => setFilter('mentor')}
                >
                  Mentors
                </button>
                <button
                  className={filter === 'mentee' ? 'active' : ''}
                  onClick={() => setFilter('mentee')}
                >
                  Mentees
                </button>
                <button
                  className="refresh-button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <FaSync className={refreshing ? 'spinning' : ''} /> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="mentor-management-stats">
            <div className="stat-card" onMouseEnter={() => setHoveredTile('total')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Total Users</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'total' ? ' stat-hidden' : ''}`}>
                  <p>{users.length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'total' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realUsers.length}</span>
                  <span className="stat-generated">Generated: {generatedUsers.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentors')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentors</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentors' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.isMentor).length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentors' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentors.length}</span>
                  <span className="stat-generated">Generated: {generatedMentors.length}</span>
                </div>
              </div>
            </div>
            <div className="stat-card" onMouseEnter={() => setHoveredTile('mentees')} onMouseLeave={() => setHoveredTile(null)}>
              <h3>Mentees</h3>
              <div className="stat-animated-number-container">
                <div className={`stat-animated-number stat-total${hoveredTile === 'mentees' ? ' stat-hidden' : ''}`}>
                  <p>{users.filter(u => u.isMentee).length}</p>
                </div>
                <div className={`stat-animated-number stat-split${hoveredTile === 'mentees' ? ' stat-visible' : ''}`}>
                  <span className="stat-real">Real: {realMentees.length}</span>
                  <span className="stat-generated">Generated: {generatedMentees.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Source Summary */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '1px solid #2a2a3e'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px' }}>📊 Profile Source Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ 
                background: 'rgba(0, 200, 255, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(0, 200, 255, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Real Profiles</div>
                <div style={{ color: '#00c8ff', fontSize: '24px', fontWeight: 'bold' }}>{realUsers.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {realMentors.length} mentors, {realMentees.length} mentees
                </div>
              </div>
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎲</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Generated Profiles</div>
                <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>{generatedUsers.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {generatedMentors.length} mentors, {generatedMentees.length} mentees
                </div>
              </div>
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Total</div>
                <div style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}>{users.length}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {users.filter(u => u.isMentor).length} mentors, {users.filter(u => u.isMentee).length} mentees
                </div>
              </div>
            </div>
          </div>

          {deleteStatus && (
            <div className={deleteStatus.startsWith('Deleted') ? 'mentor-management-success' : 'mentor-management-error'} style={{ marginBottom: '1rem' }}>
              {deleteStatus}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#ff2a2a', fontWeight: 600 }}>{selectedIds.length} selected</span>
              <button className="delete-profile" onClick={handleBulkDelete} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a', fontWeight: 600 }}>
                Delete Selected
              </button>
            </div>
          )}

          <div className="mentor-management-table">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} /></th>
                  <th onClick={() => { setUserSortField('name'); setUserSortDir(userSortField === 'name' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Name {userSortField === 'name' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('type'); setUserSortDir(userSortField === 'type' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Type {userSortField === 'type' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('email'); setUserSortDir(userSortField === 'email' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Email {userSortField === 'email' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('profession'); setUserSortDir(userSortField === 'profession' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Profession {userSortField === 'profession' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('education'); setUserSortDir(userSortField === 'education' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Education {userSortField === 'education' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setUserSortField('county'); setUserSortDir(userSortField === 'county' && userSortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>County {userSortField === 'county' ? (userSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th>Skills</th>
                  <th>Looking For</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}
                    style={user.isGenerated ? { background: 'rgba(0, 200, 255, 0.10)' } : {}}
                  >
                    <td><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectRow(user.id)} /></td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">
                          {getName(user)}
                          {user.isGenerated && (
                            <span className="generated-badge" title="Generated Profile">
                              🎲
                            </span>
                          )}
                        </span>
                        <span className="user-age">{user.age} years</span>
                      </div>
                    </td>
                    <td>
                      <span className={`user-type ${user.isMentor ? 'mentor' : 'mentee'}`}>
                        {user.isMentor ? 'Mentor' : 'Mentee'}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <div className="profession-info">
                        <span className="profession">{user.profession}</span>
                        {user.pastProfessions.length > 0 && (
                          <span className="past-professions">
                            {user.pastProfessions.length} past roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="education-info">
                        <span className="degree">{user.degree}</span>
                        <span className="education-level">{user.educationLevel}</span>
                      </div>
                    </td>
                    <td>{user.county}</td>
                    <td>
                      <div className="skills-list">
                        {user.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="more-skills">+{user.skills.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="looking-for-list">
                        {user.lookingFor.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {user.lookingFor.length > 3 && (
                          <span className="more-skills">+{user.lookingFor.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-profile" onClick={() => { setModalUser(user); setModalOpen(true); }}>View Profile</button>
                        <button className="edit-profile" onClick={() => handleEditUser(user)}>Edit</button>
                        <button className="delete-profile" onClick={() => handleDeleteUser(user)} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminMentorModal open={modalOpen} onClose={() => setModalOpen(false)} user={modalUser} mode="view" />
          <AdminMentorModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditUser(null); }} user={editUser} mode="edit" onSave={handleSaveEdit} />
        </>
      )}
      
      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div>
          {/* Booking Statistics Tiles */}
          {!loadingBookings && !bookingsError && (
            <div className="mentor-management-stats" style={{ marginBottom: 24 }}>
              {(() => {
                const stats = getBookingStats();
                return (
                  <>
                    <div className="stat-card">
                      <h3>Total Bookings</h3>
                      <p>{stats.totalBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Confirmed</h3>
                      <p style={{ color: '#00e676' }}>{stats.confirmedBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Pending</h3>
                      <p style={{ color: '#ffb300' }}>{stats.pendingBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Cancelled</h3>
                      <p style={{ color: '#ff4444' }}>{stats.cancelledBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Completion Rate</h3>
                      <p style={{ color: '#00e676' }}>{stats.completionRate.toFixed(1)}%</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Revenue</h3>
                      <p style={{ color: '#00e676' }}>£{stats.totalRevenue}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Cal.com Bookings</h3>
                      <p style={{ color: '#00eaff' }}>{stats.calComBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active Mentors</h3>
                      <p style={{ color: '#ffb300' }}>{stats.uniqueMentors}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active Mentees</h3>
                      <p style={{ color: '#00e676' }}>{stats.uniqueMentees}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Today's Bookings</h3>
                      <p style={{ color: '#00eaff' }}>{stats.todayBookings}</p>
                    </div>
                    <div className="stat-card">
                      <h3>This Week</h3>
                      <p style={{ color: '#ffb300' }}>{stats.thisWeekBookings}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          {/* Bookings View Mode Switch */}
          <div className="view-toggle-buttons">
            <button className={bookingsView === 'table' ? 'active' : ''} onClick={() => setBookingsView('table')}>Table View</button>
            <button className={bookingsView === 'grouped' ? 'active' : ''} onClick={() => setBookingsView('grouped')}>Grouped View</button>
            {bookingsView === 'grouped' && (
              <select value={groupBy} onChange={e => setGroupBy(e.target.value as 'mentor' | 'mentee')} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8 }}>
                <option value="mentor">Group by Mentor</option>
                <option value="mentee">Group by Mentee</option>
              </select>
            )}
          </div>
          
          {/* New Booking Filters */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <select 
              value={bookingGeneratedFilter} 
              onChange={e => setBookingGeneratedFilter(e.target.value as 'all' | 'generated' | 'real')} 
              style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
            >
              <option value="all">All Profiles</option>
              <option value="real">Real Profiles Only</option>
              <option value="generated">Generated Profiles Only</option>
            </select>
            <select 
              value={bookingMethodFilter} 
              onChange={e => setBookingMethodFilter(e.target.value as 'all' | 'calcom')} 
              style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}
            >
              <option value="all">All Bookings</option>
              <option value="calcom">Cal.com Bookings Only</option>
            </select>
            <div style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
              🎲 = Generated Profile | 📅 = Cal.com
            </div>
          </div>
          
          {/* Bookings Content */}
          {loadingBookings ? (
            <div className="mentor-management-loading">Loading bookings...</div>
          ) : bookingsError ? (
            <div className="mentor-management-error">{bookingsError}</div>
          ) : bookingsView === 'table' ? (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsTable bookings={filteredBookings} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          ) : (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <BookingsGrouped bookings={filteredBookings} groupBy={groupBy} onView={booking => { setSelectedBooking(booking); setDetailsModalOpen(true); }} />
              <BookingDetailsModal booking={selectedBooking} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} onDelete={handleDeleteBooking} onUpdateStatus={handleUpdateBookingStatus} />
              {actionLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#222', color: '#fff', padding: '2rem 3rem', borderRadius: 12, fontSize: 20 }}>Processing...</div></div>}
            </div>
          )}
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {tab === 'availability' && (
        <div>
          <div className="mentor-management-header">
            <h2>Mentor Availability Management</h2>
            <div className="mentor-management-controls">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <input 
                  value={availabilitySearch} 
                  onChange={e => setAvailabilitySearch(e.target.value)} 
                  placeholder="Search mentor name or email..." 
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: 15, minWidth: 180 }} 
                />
                <button
                  className="refresh-button"
                  onClick={fetchAvailability}
                  disabled={loadingAvailability}
                >
                  <FaSync className={loadingAvailability ? 'spinning' : ''} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Availability Stats */}
          <div className="mentor-management-stats">
            <div className="stat-card">
              <h3>Total Mentors with Availability</h3>
              <p>{filteredAvailability.length}</p>
            </div>
            <div className="stat-card">
              <h3>Cal.com Time Slots</h3>
              <p>{filteredAvailability.reduce((total, availability) => total + getCalComTotalSlots(availability), 0)}</p>
            </div>
            <div className="stat-card">
              <h3>Cal.com Integration</h3>
              <p>{filteredAvailability.filter(availability => availability.hasCalComIntegration).length}</p>
            </div>
          </div>

          {/* Availability Content */}
          {loadingAvailability ? (
            <div className="mentor-management-loading">Loading availability data...</div>
          ) : availabilityError ? (
            <div className="mentor-management-error">{availabilityError}</div>
          ) : (
            <div style={{ minHeight: 200, background: 'rgba(40,0,0,0.25)', borderRadius: 12, padding: 24 }}>
              <table className="admin-bookings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Email</th>
                    <th>Cal.com Integration</th>
                    <th>Cal.com Slots</th>
                    <th>Cal.com Available</th>
                    <th>Cal.com Booked</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvailability.map((availability) => (
                    <tr key={availability.mentorId} style={{ transition: 'background 0.18s', cursor: 'pointer' }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td>
                        <div className="user-info">
                          <span className="user-name">{getMentorName(availability)}</span>
                          {availability.mentorProfile?.profession && (
                            <span className="user-age">{availability.mentorProfile.profession}</span>
                          )}
                        </div>
                      </td>
                      <td>{getMentorEmail(availability)}</td>
                      <td>
                        {availability.hasCalComIntegration ? (
                          <span style={{ background: '#00eaff', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                            ✅ Connected
                          </span>
                        ) : (
                          <span style={{ background: '#666', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                            ❌ Not Connected
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ background: '#00eaff', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComTotalSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#00e676', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComAvailableSlots(availability)}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#ff4444', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getCalComBookedSlots(availability)}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const val = availability.lastUpdated;
                          if (!val) return '-';
                          if (isFirestoreTimestamp(val)) {
                            return val.toDate().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          if (val instanceof Date) {
                            return val.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          // Try to parse as string/number
                          const parsed = new Date(val);
                          if (!isNaN(parsed.getTime())) {
                            return parsed.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          }
                          return '-';
                        })()}
                      </td>
                      <td>
                        <button 
                          onClick={() => {
                            setSelectedAvailability(availability);
                            setDetailsModalOpen(true);
                          }} 
                          style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAvailability.length === 0 && (
                <div style={{ marginTop: 24, color: '#ffb300', textAlign: 'center' }}>
                  {availabilitySearch 
                    ? 'No availability data matches your search.' 
                    : 'No availability data found.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {detailsModalOpen && selectedAvailability && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#181818', color: '#fff', borderRadius: 12, padding: '2.5rem 2.5rem', minWidth: 420, maxWidth: 700, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setDetailsModalOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 1rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Close</button>
            <h2 style={{ marginBottom: 8 }}>Availability Details</h2>
            <div><b>Mentor:</b> {getMentorName(selectedAvailability)} ({getMentorEmail(selectedAvailability)})</div>
            {selectedAvailability.hasCalComIntegration && (
              <div style={{ margin: '1rem 0 1.5rem 0', color: '#00eaff' }}>
                <b>Cal.com Integration:</b> ✅ Connected | <b>Cal.com Slots:</b> {getCalComTotalSlots(selectedAvailability)} | <b>Available:</b> {getCalComAvailableSlots(selectedAvailability)} | <b>Booked:</b> {getCalComBookedSlots(selectedAvailability)}
              </div>
            )}
            {!selectedAvailability.hasCalComIntegration && (
              <div style={{ margin: '1rem 0 1.5rem 0', color: '#888' }}>
                <b>Cal.com Integration:</b> ❌ Not Connected
              </div>
            )}
            
            {/* Cal.com Availability Section */}
            {selectedAvailability.hasCalComIntegration && selectedAvailability.calComAvailability && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 12, color: '#00eaff' }}>Cal.com Availability (Next 7 Days)</h3>
                <table style={{ width: '100%', background: 'rgba(0,234,255,0.05)', borderRadius: 8, border: '1px solid #00eaff' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Event Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAvailability.calComAvailability.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>No Cal.com availability found.</td></tr>
                    ) : selectedAvailability.calComAvailability.map(day => 
                      day.slots.map(slot => (
                        <tr key={`${day.date}-${slot.time}`} style={{ background: !slot.available ? 'rgba(255,68,68,0.07)' : undefined }}>
                          <td>{new Date(day.date).toLocaleDateString('en-GB')}</td>
                          <td>{slot.time}</td>
                          <td>{slot.eventTypeTitle || 'General'}</td>
                          <td><span style={{ background: slot.available ? '#00e676' : '#ff4444', color: slot.available ? '#181818' : '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{slot.available ? 'Available' : 'Booked'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div>
          {loadingBookings ? (
            <div className="mentor-management-loading">Loading analytics data...</div>
          ) : bookingsError ? (
            <div className="mentor-management-error">{bookingsError}</div>
          ) : (
            <BookingAnalytics bookings={bookings.filter(b => b.isCalComBooking)} />
          )}
        </div>
      )}
    </div>
  );
} 