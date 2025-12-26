// Advanced Time Tracking Analytics
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TimeTracking = require('../models/TimeTracking');

// Get productivity insights
router.get('/productivity', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ insights: [] });
    }

    const { startDate, endDate } = req.query;
    
    const timeData = await TimeTracking.aggregate([
      {
        $match: {
          startTime: { 
            $gte: new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
            $lte: new Date(endDate || Date.now())
          }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$startTime' },
            dayOfWeek: { $dayOfWeek: '$startTime' }
          },
          totalTime: { $sum: '$duration' },
          sessions: { $sum: 1 }
        }
      },
      {
        $sort: { totalTime: -1 }
      }
    ]);

    const insights = {
      mostProductiveHours: timeData.slice(0, 3).map(d => ({
        hour: d._id.hour,
        totalMinutes: Math.round(d.totalTime / 60),
        sessions: d.sessions
      })),
      mostProductiveDays: calculateMostProductiveDays(timeData),
      averageSessionLength: calculateAverageSession(timeData),
      focusScore: calculateFocusScore(timeData)
    };

    res.json({ insights });
  } catch (error) {
    console.error('Error getting productivity insights:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get coding streaks
router.get('/streaks', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ currentStreak: 0, longestStreak: 0, streaks: [] });
    }

    const timeData = await TimeTracking.find({
      startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }).sort({ startTime: 1 });

    const dailyActivity = groupByDay(timeData);
    const streaks = calculateStreaks(dailyActivity);

    res.json({
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      streaks: streaks.all,
      activeDays: Object.keys(dailyActivity).length
    });
  } catch (error) {
    console.error('Error getting streaks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get language/tech stack breakdown
router.get('/languages', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ languages: [] });
    }

    const languageData = await TimeTracking.aggregate([
      {
        $match: {
          'metadata.language': { $exists: true },
          startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$metadata.language',
          totalTime: { $sum: '$duration' },
          sessions: { $sum: 1 }
        }
      },
      {
        $sort: { totalTime: -1 }
      }
    ]);

    const total = languageData.reduce((sum, lang) => sum + lang.totalTime, 0);
    
    const languages = languageData.map(lang => ({
      name: lang._id,
      totalMinutes: Math.round(lang.totalTime / 60),
      sessions: lang.sessions,
      percentage: Math.round((lang.totalTime / total) * 100)
    }));

    res.json({ languages, totalMinutes: Math.round(total / 60) });
  } catch (error) {
    console.error('Error getting language breakdown:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get project time allocation
router.get('/projects', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ projects: [] });
    }

    const projectData = await TimeTracking.aggregate([
      {
        $match: {
          'metadata.project': { $exists: true },
          startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$metadata.project',
          totalTime: { $sum: '$duration' },
          sessions: { $sum: 1 },
          languages: { $addToSet: '$metadata.language' }
        }
      },
      {
        $sort: { totalTime: -1 }
      }
    ]);

    const projects = projectData.map(proj => ({
      name: proj._id,
      totalHours: (proj.totalTime / 3600).toFixed(1),
      sessions: proj.sessions,
      languages: proj.languages.filter(Boolean)
    }));

    res.json({ projects });
  } catch (error) {
    console.error('Error getting project allocation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function calculateMostProductiveDays(timeData) {
  const dayMap = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday' };
  const dayTotals = {};
  
  timeData.forEach(d => {
    const day = dayMap[d._id.dayOfWeek];
    dayTotals[day] = (dayTotals[day] || 0) + d.totalTime;
  });
  
  return Object.entries(dayTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, time]) => ({ day, minutes: Math.round(time / 60) }));
}

function calculateAverageSession(timeData) {
  const totalSessions = timeData.reduce((sum, d) => sum + d.sessions, 0);
  const totalTime = timeData.reduce((sum, d) => sum + d.totalTime, 0);
  return totalSessions > 0 ? Math.round(totalTime / totalSessions / 60) : 0;
}

function calculateFocusScore(timeData) {
  // Focus score based on session length and consistency
  const avgSession = calculateAverageSession(timeData);
  const score = Math.min(100, Math.round((avgSession / 90) * 100));
  return score;
}

function groupByDay(timeData) {
  const dailyActivity = {};
  
  timeData.forEach(entry => {
    const day = entry.startTime.toISOString().split('T')[0];
    dailyActivity[day] = (dailyActivity[day] || 0) + entry.duration;
  });
  
  return dailyActivity;
}

function calculateStreaks(dailyActivity) {
  const days = Object.keys(dailyActivity).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streaks = [];
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || isConsecutiveDay(days[i - 1], days[i])) {
      tempStreak++;
    } else {
      if (tempStreak > 0) {
        streaks.push({ length: tempStreak, endDate: days[i - 1] });
      }
      tempStreak = 1;
    }
    
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }
  
  if (days.includes(today) || days.includes(yesterday)) {
    currentStreak = tempStreak;
  }
  
  return { current: currentStreak, longest: longestStreak, all: streaks };
}

function isConsecutiveDay(day1, day2) {
  const date1 = new Date(day1);
  const date2 = new Date(day2);
  const diff = (date2 - date1) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

module.exports = router;
