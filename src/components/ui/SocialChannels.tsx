import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../../styles/components/SocialChannels.css';

interface SocialChannelsProps {
  className?: string;
}

export default function SocialChannels({ className = '' }: SocialChannelsProps) {
  return (
    <section className={`social-channels ${className}`}>
      <h3>Follow Us</h3>
      <div className="social-media">
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
      </div>
    </section>
  );
} 