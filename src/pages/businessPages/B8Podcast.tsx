import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { PodcastEpisode } from '../../types/podcast';
import '../../styles/businessStyles/B8Podcast.css';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import SocialChannels from '../../components/ui/SocialChannels';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';

export default function B8Podcast() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [featuredEpisodes, setFeaturedEpisodes] = useState<PodcastEpisode[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<PodcastEpisode[]>([]);
  const [popularCategories] = useState<string[]>([
    'Sports Cars', 'Electric Vehicles', 'Classic Cars', 'Car Maintenance', 
    'Racing', 'Auto Industry News', 'Car Reviews', 'Future of Driving'
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => setIsMobile(window.innerWidth < 768);

  useEffect(() => {
    if (userProfile) {
      setEmail(userProfile.email || '');
      checkSubscriptionStatus();
    }
    fetchPodcastEpisodes();
  }, [userProfile]);

  const checkSubscriptionStatus = async () => {
    if (!userProfile?.email) return;
    
    try {
      const subscribersQuery = query(
        collection(db, 'podcastSubscribers'),
        where('email', '==', userProfile.email)
      );
      const querySnapshot = await getDocs(subscribersQuery);
      setSubscribed(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const fetchPodcastEpisodes = async () => {
    setIsLoading(true);
    try {
      // Fetch featured episodes
      const featuredQuery = query(
        collection(db, 'podcastEpisodes'),
        where('featured', '==', true),
        orderBy('publishDate', 'desc'),
        limit(3)
      );
      const featuredSnapshot = await getDocs(featuredQuery);
      const featuredData: PodcastEpisode[] = [];
      featuredSnapshot.forEach((doc) => {
        featuredData.push({ id: doc.id, ...doc.data() } as PodcastEpisode);
      });
      setFeaturedEpisodes(featuredData);

      // Fetch latest episodes
      const latestQuery = query(
        collection(db, 'podcastEpisodes'),
        orderBy('publishDate', 'desc'),
        limit(6)
      );
      const latestSnapshot = await getDocs(latestQuery);
      const latestData: PodcastEpisode[] = [];
      latestSnapshot.forEach((doc) => {
        latestData.push({ id: doc.id, ...doc.data() } as PodcastEpisode);
      });
      setLatestEpisodes(latestData);
    } catch (err) {
      console.error('Error fetching podcast episodes:', err);
      setError('Failed to load podcast episodes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      // Add subscription to database
      const subscriptionRef = collection(db, 'podcastSubscribers');
      await getDocs(query(subscriptionRef, where('email', '==', email))).then(async (querySnapshot) => {
        if (querySnapshot.empty) {
          await addDoc(subscriptionRef, {
            email,
            subscribedAt: Timestamp.now(),
            interests: [],
            active: true
          });
          setSubscribed(true);
          setSubmitSuccess(true);
          setTimeout(() => setSubmitSuccess(false), 3000);
        } else {
          setSubmitError('This email is already subscribed.');
          setTimeout(() => setSubmitError(''), 3000);
        }
      });
    } catch (err) {
      console.error('Error subscribing:', err);
      setSubmitError('Failed to subscribe. Please try again.');
      setTimeout(() => setSubmitError(''), 3000);
    }
  };

  const extractYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Match YouTube URL patterns
      const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
      const match = url.match(regExp);
      
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.error('Error extracting YouTube video ID:', error);
    }
    
    return null;
  };

  const handleYoutubeClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string | undefined) => {
    e.preventDefault();
    if (!url) return;
    
    const videoId = extractYoutubeVideoId(url);
    if (videoId) {
      setActiveVideoId(videoId);
    } else {
      // If we can't extract the ID, just open the URL in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const closeVideoModal = () => {
    setActiveVideoId(null);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PasswordProtectedPage businessId="podcast">
      <ComingSoonOverlay businessId="podcast">
        <div className="page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}
          <div className={`podcast-page ${isMobile ? 'mobile' : ''}`}>
            <div className="podcast-hero">
              <h1>Car Talk - B8 Podcast</h1>
              <p>Your Ultimate Destination for Automotive Insights, Stories, and Expertise</p>
              {!subscribed && (
                <div className="subscribe-form-container">
                  <form onSubmit={handleSubscribe} className="subscribe-form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit">Subscribe</button>
                  </form>
                  {submitSuccess && (
                    <div className="success-message">
                      Successfully subscribed to Car Talk - B8 Podcast!
                    </div>
                  )}
                  {submitError && (
                    <div className="error-message">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="about-section">
              <h2>About Car Talk - B8 Podcast</h2>
              <p>
                Car Talk is B8's premier automotive podcast dedicated to all things cars. From classic vehicles to the latest electric innovations, 
                our expert hosts and industry guests bring you engaging discussions, insider knowledge, and entertaining stories from the world of automobiles.
                Whether you're a car enthusiast, industry professional, or casual driver, our podcast offers valuable insights and entertainment for everyone.
              </p>
            </div>

            {isLoading ? (
              <div className="loading-section">
                <p>Loading podcast episodes...</p>
              </div>
            ) : error ? (
              <div className="error-section">
                <p>{error}</p>
              </div>
            ) : (
              <>
                {featuredEpisodes.length > 0 && (
                  <div className="featured-episodes-section">
                    <h2>Featured Episodes</h2>
                    <div className="featured-episodes-grid">
                      {featuredEpisodes.map((episode) => (
                        <div key={episode.id} className="featured-episode-card">
                          <div className="episode-image">
                            <img src={episode.imageUrl || '/assets/podcast-default.jpg'} alt={episode.title} />
                            <div className="episode-duration">{formatDuration(episode.duration)}</div>
                          </div>
                          <div className="episode-content">
                            <h3>{episode.title}</h3>
                            <p className="episode-guest">with {episode.guestName}, {episode.guestTitle}</p>
                            <p className="episode-date">{formatDate(episode.publishDate)}</p>
                            <p className="episode-description">{episode.description}</p>
                            <div className="episode-tags">
                              {episode.tags.map((tag, index) => (
                                <span key={index} className="episode-tag">{tag}</span>
                              ))}
                            </div>
                            
                            {episode.youtubeUrl && extractYoutubeVideoId(episode.youtubeUrl) && (
                              <div className="episode-video-preview">
                                <h4>Episode Video</h4>
                                <div className="episode-video-container">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${extractYoutubeVideoId(episode.youtubeUrl)}`}
                                    title={`${episode.title} - YouTube video`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </div>
                            )}
                            
                            <div className="episode-actions">
                              <a href={episode.audioUrl} className="listen-button">Listen Now</a>
                              {episode.youtubeUrl && (
                                <a href={episode.youtubeUrl} target="_blank" rel="noopener noreferrer" className="youtube-button" onClick={(e) => handleYoutubeClick(e, episode.youtubeUrl)}>
                                  Watch on YouTube
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="categories-section">
                  <h2>Popular Categories</h2>
                  <ul className="categories-list">
                    {popularCategories.map((category, index) => (
                      <li key={index} className="category-item">{category}</li>
                    ))}
                  </ul>
                </div>

                {latestEpisodes.length > 0 && (
                  <div className="latest-episodes-section">
                    <h2>Latest Episodes</h2>
                    <div className="latest-episodes-grid">
                      {latestEpisodes.map((episode) => (
                        <div key={episode.id} className="episode-card">
                          <div className="episode-card-image">
                            <img src={episode.imageUrl || '/assets/podcast-default.jpg'} alt={episode.title} />
                            <div className="episode-card-duration">{formatDuration(episode.duration)}</div>
                          </div>
                          <div className="episode-card-content">
                            <h4>{episode.title}</h4>
                            <p className="episode-card-guest">{episode.guestName}</p>
                            <p className="episode-card-date">{formatDate(episode.publishDate)}</p>
                            <div className="episode-card-actions">
                              <a href={episode.audioUrl} className="episode-card-listen">Listen</a>
                              {episode.youtubeUrl && (
                                <a 
                                  href={episode.youtubeUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="episode-card-youtube"
                                  onClick={(e) => handleYoutubeClick(e, episode.youtubeUrl)}
                                >
                                  YouTube
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="view-all-container">
                      <button className="view-all-button">View All Episodes</button>
                    </div>
                  </div>
                )}

                <div className="host-section">
                  <h2>Meet Your Hosts</h2>
                  <div className="hosts-grid">
                    <div className="host-card">
                      <img src="/assets/host1.jpg" alt="Host 1" className="host-image" />
                      <h3>Alex Morgan</h3>
                      <p className="host-title">Lead Host & Automotive Journalist</p>
                      <p className="host-bio">
                        With over 15 years of experience in the automotive industry, Alex brings expert knowledge and passion to every episode.
                      </p>
                    </div>
                    <div className="host-card">
                      <img src="/assets/host2.jpg" alt="Host 2" className="host-image" />
                      <h3>Jamie Chen</h3>
                      <p className="host-title">Co-Host & Racing Enthusiast</p>
                      <p className="host-bio">
                        Former race car driver turned podcast host, Jamie offers unique insights from both on and off the track.
                      </p>
                    </div>
                    <div className="host-card">
                      <img src="/assets/host3.jpg" alt="Host 3" className="host-image" />
                      <h3>Sam Rodriguez</h3>
                      <p className="host-title">Technical Expert & Engineer</p>
                      <p className="host-bio">
                        Automotive engineer with a specialty in electric vehicles, Sam breaks down complex topics into accessible discussions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="become-guest-section">
                  <h2>Become a Guest</h2>
                  <p>
                    Are you an automotive expert, industry insider, or have a unique car story to share? 
                    We're always looking for interesting guests to feature on Car Talk.
                  </p>
                  <button className="become-guest-button">Apply to Be a Guest</button>
                </div>

                <SocialChannels className="podcast-social-channels" />
              </>
            )}
            
            {activeVideoId && (
              <div className="video-modal-overlay" onClick={closeVideoModal}>
                <div className="video-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="close-modal-button" onClick={closeVideoModal}>×</button>
                  <div className="video-container">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
} 