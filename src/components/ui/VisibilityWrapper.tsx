import React from 'react';
import { useBanner } from '../../contexts/BannerContext';

interface VisibilityWrapperProps {
  children: React.ReactNode;
  sectionId: string;
  showPlaceholder?: boolean;
  placeholderMessage?: string;
}

export const VisibilityWrapper: React.FC<VisibilityWrapperProps> = ({
  children,
  sectionId,
  showPlaceholder = false,
  placeholderMessage = "This section is currently hidden."
}) => {
  const { isVisible, isLoading } = useBanner();

  // Show content while loading to avoid flicker
  if (isLoading) {
    return <>{children}</>;
  }

  // Check if section is visible
  const visible = isVisible(sectionId);

  // If not visible and showPlaceholder is true, show placeholder
  if (!visible && showPlaceholder) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#718096',
        background: '#f7fafc',
        border: '1px dashed #cbd5e0',
        borderRadius: '8px'
      }}>
        {placeholderMessage}
      </div>
    );
  }

  // If not visible and no placeholder, return null (hide completely)
  if (!visible) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
};

export default VisibilityWrapper;

