// Integration Hub - Connect with External Services
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Calendar Integration
router.post('/google-calendar/sync', async (req, res) => {
  try {
    const { accessToken, calendarId } = req.body;
    
    // In production, use Google Calendar API
    const mockEvents = [
      {
        id: 'gcal-1',
        summary: 'Team Meeting',
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        source: 'google-calendar'
      }
    ];
    
    res.json({ 
      success: true, 
      events: mockEvents,
      synced: mockEvents.length 
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GitHub Integration - Track project milestones
router.get('/github/milestones', async (req, res) => {
  try {
    const { repo, owner, token } = req.query;
    
    // In production, call GitHub API
    const mockMilestones = [
      {
        title: 'v1.0 Release',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: 75,
        openIssues: 5,
        closedIssues: 20
      }
    ];
    
    res.json({ milestones: mockMilestones });
  } catch (error) {
    console.error('GitHub integration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Slack Integration - Create events from Slack
router.post('/slack/webhook', async (req, res) => {
  try {
    const { text, user_name } = req.body;
    
    // Parse Slack command: /event "Meeting" tomorrow 2pm 1h
    const eventData = parseSlackCommand(text);
    
    res.json({ 
      response_type: 'in_channel',
      text: `Event "${eventData.title}" created for ${eventData.startDate}! 🎉`
    });
  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Zoom Integration - Auto-create events from Zoom meetings
router.post('/zoom/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;
    
    if (event === 'meeting.created') {
      const zoomEvent = {
        title: payload.object.topic,
        startDate: new Date(payload.object.start_time),
        duration: payload.object.duration,
        meetingUrl: payload.object.join_url,
        category: 'meeting',
        source: 'zoom'
      };
      
      res.json({ success: true, event: zoomEvent });
    } else {
      res.json({ success: true, event: 'ignored' });
    }
  } catch (error) {
    console.error('Zoom webhook error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Trello Integration - Import cards as events
router.post('/trello/import', async (req, res) => {
  try {
    const { boardId, apiKey, token } = req.body;
    
    // Mock Trello cards
    const mockCards = [
      {
        name: 'Complete Feature X',
        due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        labels: [{ name: 'Development', color: 'blue' }],
        source: 'trello'
      }
    ];
    
    res.json({ success: true, imported: mockCards.length, events: mockCards });
  } catch (error) {
    console.error('Trello import error:', error);
    res.status(500).json({ message: error.message });
  }
});

// iCal/ICS Export
router.get('/export/ical', async (req, res) => {
  try {
    const { eventIds } = req.query;
    
    // Generate iCal format
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Manager//HackaTime//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:My Events
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:event-${Date.now()}@eventmanager.app
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(new Date())}
DTEND:${formatICalDate(new Date(Date.now() + 3600000))}
SUMMARY:Sample Event
DESCRIPTION:Event exported from Event Manager
LOCATION:Virtual
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');
    res.send(icalContent);
  } catch (error) {
    console.error('iCal export error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper: Parse Slack command
function parseSlackCommand(text) {
  // Simple parser for demonstration
  const parts = text.split(' ');
  return {
    title: parts[0],
    startDate: new Date(),
    duration: 60
  };
}

// Helper: Format date for iCal
function formatICalDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

module.exports = router;
