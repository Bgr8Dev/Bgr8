import { FaGraduationCap } from 'react-icons/fa';
import './ProfilePicture.css';

interface ProfilePictureProps {
  src?: string | string[] | null;
  alt?: string;
  className?: string;
  role?: 'mentor' | 'mentee' | null;
  size?: number;
  showPlaceholder?: boolean;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt = 'Profile',
  className = '',
  role = null,
  size = 120,
  showPlaceholder = true
}) => {
  // Get the image source
  const getImageSrc = (): string | null => {
    if (Array.isArray(src)) {
      return src[0] || null;
    }
    if (typeof src === 'string' && src.trim() !== '') {
      return src;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  // If we have an image, show it
  if (imageSrc) {
    return (
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`profile-picture ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // If no image and showPlaceholder is false, return null
  if (!showPlaceholder) {
    return null;
  }

  // Render role-based placeholder
  if (role === 'mentor') {
    // Orange circle for mentor
    return (
      <div 
        className={`profile-picture-placeholder profile-picture-placeholder-mentor ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'var(--mentor)',
          borderColor: 'var(--mentor)',
          boxShadow: '0 0 15px rgba(224, 106, 92, 0.5)'
        }}
        title={alt}
      />
    );
  } else if (role === 'mentee') {
    // Graduation cap with teal circle for mentee
    return (
      <div 
        className={`profile-picture-placeholder profile-picture-placeholder-mentee ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'var(--mentee)',
          borderColor: 'var(--mentee)',
          boxShadow: '0 0 15px rgba(29, 213, 209, 0.5)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={alt}
      >
        <FaGraduationCap size={size * 0.4} />
      </div>
    );
  } else {
    // Default placeholder (first letter of alt text)
    return (
      <div 
        className={`profile-picture-placeholder ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`
        }}
        title={alt}
      >
        {alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }
};

