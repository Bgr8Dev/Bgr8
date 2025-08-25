import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from '../../firebase/firebase';
import { doc, getDoc, addDoc, collection, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { SessionFeedback } from '../../types/b8fc';
import { CalComService, CalComBookingResponse } from '../../components/widgets/MentorAlgorithm/CalCom/calComService';
import { Booking } from '../../types/bookings';
import { FaStar, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/FeedbackPage.css';

export default function FeedbackPage() {
  const { currentUser } = useAuth();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Feedback form state
  const [helpfulness, setHelpfulness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [support, setSupport] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [learnings, setLearnings] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Determine user role and feedback type
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | null>(null);
  const [feedbackType, setFeedbackType] = useState<'mentor' | 'mentee' | null>(null);

    useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId || !currentUser) return;
      
      try {
        // First, try to fetch from Firestore bookings
        const bookingDoc = await getDoc(doc(firestore, 'bookings', bookingId));
        
        if (bookingDoc.exists()) {
          const bookingData = bookingDoc.data() as Booking;
          bookingData.id = bookingDoc.id;
          
          // Determine user role
          const role = bookingData.mentorId === currentUser.uid ? 'mentor' : 'mentee';
          const feedbackType = role === 'mentor' ? 'mentee' : 'mentor';
          
          setBooking(bookingData);
          setUserRole(role);
          setFeedbackType(feedbackType);
        } else {
          // If not found in Firestore, check if it's a Cal.com booking
          if (bookingId.startsWith('calcom-')) {
            try {
              // Extract the actual Cal.com booking ID
              const calComBookingId = bookingId.replace('calcom-', '');
              
              // We need to find which mentor this Cal.com booking belongs to
              // For now, we'll try to find it in our Firestore bookings that reference Cal.com
              const bookingsRef = collection(firestore, 'bookings');
              const q = query(bookingsRef, where('calComBookingId', '==', calComBookingId));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const bookingDoc = querySnapshot.docs[0];
                const bookingData = bookingDoc.data() as Booking;
                bookingData.id = bookingDoc.id;
                bookingData.isCalComBooking = true;
                bookingData.calComBookingId = calComBookingId;
                
                // Determine user role
                const role = bookingData.mentorId === currentUser.uid ? 'mentor' : 'mentee';
                const feedbackType = role === 'mentor' ? 'mentee' : 'mentor';
                
                setBooking(bookingData);
                setUserRole(role);
                setFeedbackType(feedbackType);
              } else {
                // If not found in Firestore, try to fetch from Cal.com API
                try {
                                     // We need to find which mentor this Cal.com booking belongs to
                   // Let's try to fetch all mentors and check their Cal.com bookings
                   const usersSnapshot = await getDocs(collection(firestore, 'users'));
                   let foundBooking = false;
                   
                   for (const userDoc of usersSnapshot.docs) {
                     try {
                       const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
                       if (mentorProgramDoc.exists()) {
                         const mentorData = mentorProgramDoc.data();
                         if (mentorData.isMentor && mentorData.calCom) {
                           const calComBookings = await CalComService.getBookings(userDoc.id);
                           const matchingBooking = calComBookings.find((booking: CalComBookingResponse) => 
                             booking.id.toString() === calComBookingId
                           );
                           
                           if (matchingBooking) {
                             // Found the booking! Create a proper booking object
                             const startDate = new Date(matchingBooking.startTime);
                             const endDate = new Date(matchingBooking.endTime);
                             
                             // Find mentor and mentee from attendees
                             const mentor = matchingBooking.attendees.find(attendee => 
                               attendee.email === mentorData.email
                             );
                             const mentee = matchingBooking.attendees.find(attendee => 
                               attendee.email !== mentorData.email
                             );

                             let createdAtTS = (
                              matchingBooking.createdAt 
                              ? Timestamp.fromDate(new Date(matchingBooking.createdAt)) 
                              : Timestamp.fromDate(new Date()));
                             
                             const bookingData: Booking = {
                               id: bookingId,
                               day: startDate.toLocaleDateString('en-GB', { weekday: 'long' }),
                               createdAt: createdAtTS,
                               mentorId: userDoc.id,
                               menteeId: mentee?.email || currentUser.uid,
                               mentorName: mentor?.name || `${mentorData.firstName || 'Unknown'} ${mentorData.lastName || 'Mentor'}`,
                               menteeName: mentee?.name || 'Unknown Mentee',
                               mentorEmail: mentor?.email || mentorData.email || '',
                               menteeEmail: mentee?.email || '',
                               sessionDate: Timestamp.fromDate(startDate),
                               startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                               endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                               status: 'confirmed',
                               isCalComBooking: true,
                               calComBookingId: calComBookingId
                             };
                             
                             // Determine user role
                             const role = bookingData.mentorId === currentUser.uid ? 'mentor' : 'mentee';
                             const feedbackType = role === 'mentor' ? 'mentee' : 'mentor';
                             
                             setBooking(bookingData);
                             setUserRole(role);
                             setFeedbackType(feedbackType);
                             foundBooking = true;
                             break;
                           }
                         }
                       }
                     } catch (err) {
                       console.error(`Error fetching Cal.com bookings for mentor ${userDoc.id}:`, err);
                       // Continue to next mentor
                     }
                   }
                  
                  if (!foundBooking) {
                    setError('Cal.com booking not found. This booking may not be associated with any mentor in our system.');
                  }
                  
                } catch (err) {
                  console.error('Error fetching from Cal.com API:', err);
                  setError('Failed to fetch Cal.com booking details. Please try again or contact support.');
                }
              }
            } catch (err) {
              console.error('Error fetching Cal.com booking:', err);
              setError('Failed to load Cal.com booking details');
            }
          } else {
            setError('Booking not found');
          }
        }
        
        // Check if feedback already exists
        // Note: In a real implementation, you'd query for existing feedback
        
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [bookingId, currentUser]);

  const handleRatingChange = (question: 'helpfulness' | 'comfort' | 'support', value: number) => {
    switch (question) {
      case 'helpfulness':
        setHelpfulness(value);
        break;
      case 'comfort':
        setComfort(value);
        break;
      case 'support':
        setSupport(value);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!booking || !currentUser || !feedbackType) return;
    
    // Validate required fields
    if (helpfulness === 0 || comfort === 0 || support === 0) {
      setError('Please provide ratings for all questions');
      return;
    }
    
    if (!strengths.trim() || !improvements.trim() || !learnings.trim()) {
      setError('Please fill in all text fields');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const overallRating = Math.round((helpfulness + comfort + support) / 3);
      
      const feedbackData: Omit<SessionFeedback, 'id'> = {
        bookingId: booking.id,
        mentorId: booking.mentorId,
        menteeId: booking.menteeId,
        mentorName: booking.mentorName,
        menteeName: booking.menteeName,
        sessionDate: booking.sessionDate!.toDate(),
        feedbackType,
        submittedBy: currentUser.uid,
        submittedAt: new Date(),
        helpfulness,
        comfort,
        support,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        learnings: learnings.trim(),
        overallRating,
        isAnonymous,
        status: 'submitted'
      };
      
      const feedbackRef = await addDoc(collection(firestore, 'feedback'), feedbackData);
      
      // Update booking status to indicate feedback was given
      await updateDoc(doc(firestore, 'bookings', booking.id), {
        [`feedbackSubmitted_${feedbackType}`]: true,
        [`feedbackSubmittedAt_${feedbackType}`]: new Date()
      });
      
      // For Cal.com bookings, also store a reference in the feedback
      if (booking.isCalComBooking && booking.calComBookingId) {
        // Update the feedback record with Cal.com reference
        await updateDoc(doc(firestore, 'feedback', feedbackRef.id), {
          calComBookingId: booking.calComBookingId,
          isCalComBooking: true
        });
      }
      
      setSuccess('Thank you for your feedback! Your response has been submitted successfully.');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (
    question: 'helpfulness' | 'comfort' | 'support',
    value: number,
    onChange: (value: number) => void
  ) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
                     <button
             key={star}
             type="button"
             className={`star ${star <= value ? 'filled' : ''}`}
             onClick={() => onChange(star)}
             title={`Rate ${star} star${star > 1 ? 's' : ''}`}
             onMouseEnter={(e) => {
               const stars = e.currentTarget.parentElement?.children;
               if (stars) {
                 for (let i = 0; i < stars.length; i++) {
                   if (i < star) {
                     stars[i].classList.add('hover');
                   } else {
                     stars[i].classList.remove('hover');
                   }
                 }
               }
             }}
             onMouseLeave={(e) => {
               const stars = e.currentTarget.parentElement?.children;
               if (stars) {
                 for (let i = 0; i < stars.length; i++) {
                   stars[i].classList.remove('hover');
                 }
               }
             }}
           >
             <FaStar />
           </button>
        ))}
        <span className="rating-label">
          {value === 0 && 'Select rating'}
          {value === 1 && 'Poor'}
          {value === 2 && 'Fair'}
          {value === 3 && 'Good'}
          {value === 4 && 'Very Good'}
          {value === 5 && 'Excellent'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="feedback-page">
        <div className="error-container">
          <FaTimes className="error-icon" />
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            <FaArrowLeft /> Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="feedback-page">
        <div className="error-container">
          <FaTimes className="error-icon" />
          <h2>Booking Not Found</h2>
          <p>The session you're looking for doesn't exist or you don't have permission to view it.</p>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            <FaArrowLeft /> Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const otherPartyName = userRole === 'mentor' ? booking.menteeName : booking.mentorName;
  const sessionDate =
    booking.sessionDate
      ? new Date(
          // If it's a Firestore Timestamp, use .toDate(), otherwise assume it's a Date
          typeof (booking.sessionDate as any).toDate === 'function'
            ? (booking.sessionDate as any).toDate()
            : booking.sessionDate
        ).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '';

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <button onClick={() => navigate('/profile')} className="back-button">
            <FaArrowLeft /> Back to Profile
          </button>
          <h1>Session Feedback</h1>
          <div className="session-info">
            <h2>Session with {otherPartyName}</h2>
            <p>{sessionDate} • {booking.startTime} - {booking.endTime}</p>
          </div>
        </div>

        {success && (
          <div className="success-message">
            <FaCheck /> {success}
          </div>
        )}

        {error && (
          <div className="error-message">
            <FaTimes /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-section">
            <h3>Rate Your Experience</h3>
            <p className="section-description">
              Please rate your experience on a scale of 1 to 5, where 1 is Poor and 5 is Excellent.
            </p>
            
            <div className="rating-question">
              <label>
                How helpful and engaged has your {feedbackType} been during your sessions?
                <span className="question-hint">(e.g., listens well, gives advice, makes time for you)</span>
              </label>
              {renderStarRating('helpfulness', helpfulness, (value) => handleRatingChange('helpfulness', value))}
            </div>

            <div className="rating-question">
              <label>
                Do you feel comfortable talking to your {feedbackType} and asking questions?
              </label>
              {renderStarRating('comfort', comfort, (value) => handleRatingChange('comfort', value))}
            </div>

            <div className="rating-question">
              <label>
                Have you felt supported and understood in your mentorship?
                <span className="question-hint">(Do you feel they "get" you and your goals?)</span>
              </label>
              {renderStarRating('support', support, (value) => handleRatingChange('support', value))}
            </div>
          </div>

          <div className="form-section">
            <h3>Share Your Thoughts</h3>
            <p className="section-description">
              Please provide specific examples and constructive feedback to help improve the mentorship experience.
            </p>
            
            <div className="text-question">
              <label htmlFor="strengths">
                What's one thing your {feedbackType} does well?
              </label>
              <textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Share what your mentor/mentee excels at..."
                rows={3}
                required
              />
            </div>

            <div className="text-question">
              <label htmlFor="improvements">
                What's one thing your {feedbackType} could do to better support you?
              </label>
              <textarea
                id="improvements"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Share constructive suggestions for improvement..."
                rows={3}
                required
              />
            </div>

            <div className="text-question">
              <label htmlFor="learnings">
                What's one thing you've gained or learned from this mentorship so far?
              </label>
              <textarea
                id="learnings"
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                placeholder="Share your key takeaways and learnings..."
                rows={3}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="anonymous-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span className="checkmark"></span>
                Submit feedback anonymously
              </label>
              <p className="checkbox-hint">
                Your name will not be shared with the {feedbackType}, but your feedback will still be valuable for improvement.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 