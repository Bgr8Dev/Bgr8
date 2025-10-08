import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BannerProvider } from '../../../contexts/BannerContext';
import BannerManagement from './BannerManagement';

// Mock Firebase
jest.mock('../../../firebase/firebase', () => ({
  firestore: {}
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

const MockBannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BannerProvider>
    {children}
  </BannerProvider>
);

describe('BannerManagement', () => {
  it('renders with default settings when Firebase document does not exist', async () => {
    const onSnapshot = jest.requireMock('firebase/firestore').onSnapshot;
    
    // Mock onSnapshot to simulate document not existing
    onSnapshot.mockImplementation((docRef: unknown, callback: (doc: { exists: () => boolean; data: () => null }) => void) => {
      // Simulate document not existing
      callback({
        exists: () => false,
        data: () => null
      });
      return jest.fn(); // unsubscribe function
    });

    render(
      <MockBannerProvider>
        <BannerManagement />
      </MockBannerProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading banner settings...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading banner settings...')).not.toBeInTheDocument();
    });

    // Should show first time setup notice
    expect(screen.getByText(/Welcome! This is your first time setting up banners/)).toBeInTheDocument();

    // Should show banner management interface
    expect(screen.getByText('Banner Management')).toBeInTheDocument();
    expect(screen.getByText('In Development Banner')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon Banner')).toBeInTheDocument();
  });

  it('allows toggling banner settings', async () => {
    const onSnapshot = jest.requireMock('firebase/firestore').onSnapshot;
    
    onSnapshot.mockImplementation((docRef: unknown, callback: (doc: { exists: () => boolean; data: () => null }) => void) => {
      callback({
        exists: () => false,
        data: () => null
      });
      return jest.fn();
    });

    render(
      <MockBannerProvider>
        <BannerManagement />
      </MockBannerProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading banner settings...')).not.toBeInTheDocument();
    });

    // Find and click the toggle for In Development banner
    const inDevToggle = screen.getByLabelText(/Enable In Development Banner/i);
    fireEvent.click(inDevToggle);

    // Should show save button
    expect(screen.getByText('Save Banner Settings')).toBeInTheDocument();
  });
});
