const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const { authenticateToken } = require('../middleware/auth');
const Team = require('../models/Team');
const Comment = require('../models/Comment');

// Initialize Pusher for real-time features
let pusher = null;
if (process.env.PUSHER_APP_ID) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  });
}

// Create team workspace
router.post('/teams', authenticateToken, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const team = new Team({
      name,
      description,
      owner: req.user.userId,
      members: [
        { userId: req.user.userId, role: 'owner', joinedAt: new Date() },
        ...members.map(m => ({ ...m, joinedAt: new Date() }))
      ]
    });

    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's teams
router.get('/teams', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({
      'members.userId': req.user.userId
    }).populate('owner', 'name email avatar');

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team details
router.get('/teams/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update team
router.put('/teams/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is owner
    if (team.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only team owner can update team' });
    }

    Object.assign(team, req.body);
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add team member
router.post('/teams/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check permissions
    const userMember = team.members.find(m => m.userId.toString() === req.user.userId);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Add member
    team.members.push({
      userId,
      role,
      joinedAt: new Date()
    });

    await team.save();

    // Send real-time update
    if (pusher) {
      pusher.trigger(`team-${team._id}`, 'member-added', {
        userId,
        role,
        addedBy: req.user.userId
      });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove team member
router.delete('/teams/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check permissions
    const userMember = team.members.find(m => m.userId.toString() === req.user.userId);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    team.members = team.members.filter(m => m.userId.toString() !== req.params.userId);
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Share event with team
router.post('/events/:eventId/share', authenticateToken, async (req, res) => {
  try {
    const { teamId, permissions } = req.body;
    const Event = require('../models/Event');

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.sharedWith = event.sharedWith || [];
    event.sharedWith.push({
      teamId,
      permissions: permissions || ['view'],
      sharedAt: new Date(),
      sharedBy: req.user.userId
    });

    await event.save();

    // Notify team members
    if (pusher) {
      pusher.trigger(`team-${teamId}`, 'event-shared', {
        eventId: event._id,
        title: event.title,
        sharedBy: req.user.userId
      });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to event
router.post('/events/:eventId/comments', authenticateToken, async (req, res) => {
  try {
    const { content, mentions } = req.body;

    const comment = new Comment({
      eventId: req.params.eventId,
      userId: req.user.userId,
      content,
      mentions: mentions || []
    });

    await comment.save();
    await comment.populate('userId', 'name avatar');

    // Real-time update
    if (pusher) {
      pusher.trigger(`event-${req.params.eventId}`, 'new-comment', comment);
    }

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const Notification = require('../models/Notification');
      for (const mentionedUserId of mentions) {
        await Notification.create({
          userId: mentionedUserId,
          type: 'in-app',
          message: `You were mentioned in a comment`,
          data: { eventId: req.params.eventId, commentId: comment._id }
        });
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get event comments
router.get('/events/:eventId/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await Comment.find({ eventId: req.params.eventId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update comment
router.put('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    comment.content = req.body.content;
    comment.edited = true;
    comment.editedAt = new Date();
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get activity feed
router.get('/teams/:id/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get team events and activities
    const Event = require('../models/Event');
    const activities = await Event.find({
      'sharedWith.teamId': req.params.id
    })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name avatar');

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
