import React from 'react';
import { SessionsList } from '../components/sessions/SessionsList';
import '../styles/sessions.css';

export const SessionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <SessionsList />
      </div>
    </div>
  );
};
