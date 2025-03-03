import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { CvFormData, PodcastEpisode } from '../../types/podcast';
import '../../styles/adminStyles/AdminPortalB8Podcast.css';
import { BusinessSection } from '../../components/admin/BusinessSection';

interface AdminPortalB8PodcastProps {
  stats: { totalMembers: number; activeMembers: number; revenue: number; engagement: number };
}

export function AdminPortalB8Podcast({ stats }: AdminPortalB8PodcastProps) {
  const [cvs, setCvs] = useState<CvFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [showAddEpisodeForm, setShowAddEpisodeForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newEpisode, setNewEpisode] = useState<Omit<PodcastEpisode, 'id' | 'audioUrl' | 'imageUrl' | 'publishDate'>>({
    title: '',
    description: '',
    guestName: '',
    guestTitle: '',
    duration: 0,
    tags: [],
    featured: false,
    youtubeUrl: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setLoading(true);
        const cvsQuery = query(collection(db, 'B8Podcast'));
        const querySnapshot = await getDocs(cvsQuery);
        const cvsData: CvFormData[] = [];
        
        querySnapshot.forEach((doc) => {
          cvsData.push({ id: doc.id, ...doc.data() } as CvFormData);
        });
        
        setCvs(cvsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEpisodes = async () => {
      try {
        setLoadingEpisodes(true);
        const episodesQuery = query(collection(db, 'podcastEpisodes'));
        const querySnapshot = await getDocs(episodesQuery);
        const episodesData: PodcastEpisode[] = [];
        
        querySnapshot.forEach((doc) => {
          episodesData.push({ id: doc.id, ...doc.data() } as PodcastEpisode);
        });
        
        setEpisodes(episodesData);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    fetchCVs();
    fetchEpisodes();
  }, []);

  const updateCVStatus = async (cvId: string, newStatus: CvFormData['status']) => {
    try {
      const cvRef = doc(db, 'B8Podcast', cvId);
      await updateDoc(cvRef, {
        status: newStatus
      });
      
      // Update local state
      setCvs(prevCvs => 
        prevCvs.map(cv => 
          cv.id === cvId ? { ...cv, status: newStatus } : cv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'duration') {
      // Convert string to number for duration
      setNewEpisode(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (type === 'checkbox') {
      // Handle checkbox for featured
      const checked = (e.target as HTMLInputElement).checked;
      setNewEpisode(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'youtubeUrl') {
      // Handle YouTube URL input
      setNewEpisode(prev => ({ ...prev, [name]: value }));
      
      // Update YouTube preview if URL is valid
      if (value) {
        const { valid, videoId } = validateYoutubeUrl(value);
        if (valid && videoId) {
          setYoutubePreview(videoId);
        } else {
          setYoutubePreview(null);
        }
      } else {
        setYoutubePreview(null);
      }
    } else {
      // Handle other inputs
      setNewEpisode(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newEpisode.tags.includes(tagInput.trim())) {
      setNewEpisode(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewEpisode(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAudioFile(files[0]);
    }
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFile(files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      if (!audioFile) {
        throw new Error('Please select an audio file');
      }

      // Validate audio file size (50MB max)
      if (audioFile.size > 50 * 1024 * 1024) {
        throw new Error('Audio file size must be less than 50MB');
      }

      // Validate image file if provided
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Image file size must be less than 5MB');
      }

      // Validate YouTube URL if provided
      if (newEpisode.youtubeUrl) {
        const { valid } = validateYoutubeUrl(newEpisode.youtubeUrl);
        if (!valid) {
          throw new Error('Please enter a valid YouTube URL');
        }
      }

      // Upload audio file
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const safeAudioFileName = audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const audioFilePath = `podcast/audio/${timestamp}_${uniqueId}_${safeAudioFileName}`;
      const audioRef = ref(storage, audioFilePath);
      await uploadBytes(audioRef, audioFile);
      const audioUrl = await getDownloadURL(audioRef);

      // Upload image file if provided
      let imageUrl = '';
      if (imageFile) {
        const safeImageFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const imageFilePath = `podcast/images/${timestamp}_${uniqueId}_${safeImageFileName}`;
        const imageRef = ref(storage, imageFilePath);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Create episode document
      const episodeData = {
        ...newEpisode,
        audioUrl,
        imageUrl,
        publishDate: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'podcastEpisodes'), episodeData);
      
      // Add the new episode to the state
      setEpisodes(prev => [
        { 
          ...episodeData, 
          id: docRef.id,
          publishDate: { 
            seconds: Math.floor(Date.now() / 1000), 
            nanoseconds: 0 
          } 
        } as PodcastEpisode,
        ...prev
      ]);

      // Reset form
      setNewEpisode({
        title: '',
        description: '',
        guestName: '',
        guestTitle: '',
        duration: 0,
        tags: [],
        featured: false,
        youtubeUrl: ''
      });
      setAudioFile(null);
      setImageFile(null);
      setShowAddEpisodeForm(false);
      setSubmitSuccess(true);
      setYoutubePreview(null);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting episode:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit episode');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateYoutubeUrl = (url: string): { valid: boolean; videoId?: string } => {
    if (!url) return { valid: true }; // Empty URL is considered valid (optional field)
    
    // Match YouTube URL patterns
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
    const match = url.match(regExp);
    
    if (match && match[1]) {
      return { valid: true, videoId: match[1] };
    } else {
      return { valid: false };
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | null): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-portal-podcast">
      <h2>B8 Podcast</h2>
      <BusinessSection stats={stats} businessName="Podcast" />
      
      <div className="podcast-submissions-section">
        <h3>Submissions</h3>
        {loading ? (
          <p>Loading submissions...</p>
        ) : cvs.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Area of Expertise</th>
                  <th>Submission</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {cvs.map((cv) => (
                  <tr key={cv.id}>
                    <td>{cv.name}</td>
                    <td>{cv.email}</td>
                    <td>{cv.phone}</td>
                    <td>{cv.industry}</td>
                    <td>
                      {cv.cvUrl && (
                        <a href={cv.cvUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      )}
                    </td>
                    <td>
                      <select 
                        value={cv.status} 
                        onChange={(e) => updateCVStatus(cv.id, e.target.value as CvFormData['status'])}
                        className={`status-select status-${cv.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      {cv.dateSubmitted ? new Date(cv.dateSubmitted.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="podcast-management-section">
        <h3>Podcast Episodes</h3>
        
        {submitSuccess && (
          <div className="success-message">
            Episode successfully added!
          </div>
        )}
        
        {submitError && (
          <div className="error-message">
            {submitError}
          </div>
        )}
        
        <div className="podcast-actions">
          <button 
            className="add-episode-button"
            onClick={() => {
              setShowAddEpisodeForm(!showAddEpisodeForm);
              if (showAddEpisodeForm) {
                setYoutubePreview(null);
              }
            }}
          >
            {showAddEpisodeForm ? 'Cancel' : '+ Add New Episode'}
          </button>
        </div>
        
        {showAddEpisodeForm && (
          <div className="add-episode-form-container">
            <h4>Add New Episode</h4>
            <form onSubmit={handleSubmit} className="add-episode-form">
              <div className="form-group">
                <label htmlFor="title">Episode Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEpisode.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter episode title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newEpisode.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter episode description"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="youtubeUrl">YouTube Video URL (Optional)</label>
                <input
                  type="url"
                  id="youtubeUrl"
                  name="youtubeUrl"
                  value={newEpisode.youtubeUrl || ''}
                  onChange={handleInputChange}
                  placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=XXXXXXXXXXX)"
                />
                <small className="form-help-text">Add a YouTube video link for this episode if available</small>
                
                {youtubePreview && (
                  <div className="youtube-preview">
                    <p>YouTube Video Preview:</p>
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${youtubePreview}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="guestName">Guest Name</label>
                  <input
                    type="text"
                    id="guestName"
                    name="guestName"
                    value={newEpisode.guestName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter guest name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="guestTitle">Guest Title</label>
                  <input
                    type="text"
                    id="guestTitle"
                    name="guestTitle"
                    value={newEpisode.guestTitle}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter guest title/position"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (seconds)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={newEpisode.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Enter duration in seconds"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={newEpisode.featured}
                      onChange={handleInputChange}
                    />
                    Featured Episode
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <div className="tags-input-container">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddTag}
                    className="add-tag-button"
                  >
                    Add
                  </button>
                </div>
                <div className="tags-container">
                  {newEpisode.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="remove-tag-button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="audioFile">Audio File (MP3)</label>
                  <input
                    type="file"
                    id="audioFile"
                    accept="audio/mpeg,audio/mp3"
                    onChange={handleAudioFileChange}
                    required={!audioFile}
                  />
                  {audioFile && (
                    <p className="file-info">Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="imageFile">Cover Image (Optional)</label>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageFileChange}
                  />
                  {imageFile && (
                    <p className="file-info">Selected: {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Uploading...' : 'Add Episode'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddEpisodeForm(false);
                    setYoutubePreview(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {loadingEpisodes ? (
          <p>Loading episodes...</p>
        ) : episodes.length === 0 ? (
          <p>No episodes found. Add your first episode!</p>
        ) : (
          <div className="episodes-table-container">
            <table className="episodes-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Guest</th>
                  <th>Duration</th>
                  <th>Published</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((episode) => (
                  <tr key={episode.id}>
                    <td>{episode.title}</td>
                    <td>{episode.guestName}</td>
                    <td>{formatDuration(episode.duration)}</td>
                    <td>{formatDate(episode.publishDate)}</td>
                    <td>{episode.featured ? 'Yes' : 'No'}</td>
                    <td className="episode-actions">
                      <a href={episode.audioUrl} target="_blank" rel="noopener noreferrer" className="action-button listen-button">
                        Listen
                      </a>
                      {episode.youtubeUrl && (
                        <a href={episode.youtubeUrl} target="_blank" rel="noopener noreferrer" className="action-button youtube-button">
                          YouTube
                        </a>
                      )}
                      <button className="action-button edit-button">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 