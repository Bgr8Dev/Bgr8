const express = require('express');
const cors = require('cors');
const { GoogleMeetService } = require('./googleMeetService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Meet Service
let googleMeetService;
try {
  googleMeetService = new GoogleMeetService();
  console.log('✅ Google Meet Service initialized successfully');
} catch (error) {
  console.log('⚠️  Google Meet Service not configured:', error.message);
  console.log('   Using fallback calendar integration');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    googleMeetConfigured: !!googleMeetService,
    timestamp: new Date().toISOString()
  });
});

// Create Google Meet meeting
app.post('/api/create-meeting', async (req, res) => {
  try {
    const { booking } = req.body;
    
    console.log('Received booking for meeting creation:', booking);
    if (!booking) {
      return res.status(400).json({ error: 'Booking data is required' });
    }

    // Validate booking data
    const requiredFields = ['id', 'mentorName', 'menteeName', 'sessionDate', 'startTime', 'endTime'];
    for (const field of requiredFields) {
      if (!booking[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    if (googleMeetService) {
      // Use Google Meet API
      const meetingData = await googleMeetService.createMeeting(booking);
      res.json({
        success: true,
        meetLink: meetingData.meetLink,
        eventId: meetingData.eventId,
        htmlLink: meetingData.htmlLink,
        method: 'google-meet-api',
        message: `Meeting created in service account calendar. Share the Meet link with ${booking.mentorEmail} and ${booking.menteeEmail}.`
      });
    } else {
      // Fallback to calendar event link
      const calendarLink = createCalendarEventLink(booking);
      res.json({
        success: true,
        meetLink: calendarLink,
        method: 'calendar-fallback',
        message: 'Google Meet API not configured. Add this event to your Google Calendar to get the Meet link'
      });
    }
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ 
      error: 'Failed to create meeting',
      details: error.message 
    });
  }
});

// Delete Google Meet meeting
app.delete('/api/delete-meeting/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!googleMeetService) {
      return res.status(400).json({ error: 'Google Meet API not configured' });
    }

    await googleMeetService.deleteMeeting(eventId);
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ 
      error: 'Failed to delete meeting',
      details: error.message 
    });
  }
});

// Update Google Meet meeting
app.put('/api/update-meeting/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { booking } = req.body;
    
    if (!booking) {
      return res.status(400).json({ error: 'Booking data is required' });
    }

    if (!googleMeetService) {
      return res.status(400).json({ error: 'Google Meet API not configured' });
    }

    const meetingData = await googleMeetService.updateMeeting(eventId, booking);
    res.json({
      success: true,
      meetLink: meetingData.meetLink,
      eventId: meetingData.eventId,
      htmlLink: meetingData.htmlLink
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ 
      error: 'Failed to update meeting',
      details: error.message 
    });
  }
});

// Fallback function for calendar event link
function createCalendarEventLink(booking) {
  const sessionDate = new Date(booking.sessionDate);
  const [startHours, startMinutes] = booking.startTime.split(':').map(Number);
  const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
  
  const startTime = new Date(sessionDate);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(sessionDate);
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const eventTitle = `Mentoring Session: ${booking.mentorName} & ${booking.menteeName}`;
  const eventDescription = `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).

Session Details:
- Date: ${sessionDate.toLocaleDateString('en-GB')}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: 1 hour

This meeting will include Google Meet integration.`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(eventDescription)}&add=true`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Meet Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints:`);
  console.log(`   POST /api/create-meeting`);
  console.log(`   DELETE /api/delete-meeting/:eventId`);
  console.log(`   PUT /api/update-meeting/:eventId`);
}); 