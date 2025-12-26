const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const TimeTracking = require('../models/TimeTracking');

// Get comprehensive analytics
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Total events and categories breakdown
    const events = await Event.find(dateFilter.startDate ? { startDate: dateFilter } : {});
    
    const categoryBreakdown = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});

    const priorityBreakdown = events.reduce((acc, event) => {
      acc[event.priority] = (acc[event.priority] || 0) + 1;
      return acc;
    }, {});

    // Time tracking stats
    const timeTrackings = await TimeTracking.find(
      dateFilter.timestamp ? { timestamp: dateFilter } : {}
    );

    const totalTimeTracked = timeTrackings.reduce((sum, t) => sum + t.duration, 0);
    const avgTimePerEvent = events.length > 0 ? totalTimeTracked / events.length : 0;

    const sourceBreakdown = timeTrackings.reduce((acc, tracking) => {
      acc[tracking.source] = (acc[tracking.source] || 0) + tracking.duration;
      return acc;
    }, {});

    // Productivity metrics
    const currentDate = new Date();
    const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyEvents = events.filter(e => new Date(e.createdAt) >= weekAgo).length;
    const monthlyEvents = events.filter(e => new Date(e.createdAt) >= monthAgo).length;

    const weeklyTime = timeTrackings
      .filter(t => new Date(t.timestamp) >= weekAgo)
      .reduce((sum, t) => sum + t.duration, 0);

    const monthlyTime = timeTrackings
      .filter(t => new Date(t.timestamp) >= monthAgo)
      .reduce((sum, t) => sum + t.duration, 0);

    // Completion rate
    const completedEvents = events.filter(e => 
      e.endDate && new Date(e.endDate) < currentDate
    ).length;
    const completionRate = events.length > 0 ? (completedEvents / events.length) * 100 : 0;

    // Most productive hours
    const hourlyBreakdown = timeTrackings.reduce((acc, tracking) => {
      const hour = new Date(tracking.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + tracking.duration;
      return acc;
    }, {});

    const mostProductiveHour = Object.entries(hourlyBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

    res.json({
      summary: {
        totalEvents: events.length,
        completedEvents,
        completionRate: completionRate.toFixed(2),
        totalTimeTracked,
        avgTimePerEvent: avgTimePerEvent.toFixed(2),
        weeklyEvents,
        monthlyEvents,
        weeklyTimeHours: (weeklyTime / 3600).toFixed(2),
        monthlyTimeHours: (monthlyTime / 3600).toFixed(2)
      },
      breakdowns: {
        byCategory: categoryBreakdown,
        byPriority: priorityBreakdown,
        bySource: Object.fromEntries(
          Object.entries(sourceBreakdown).map(([k, v]) => [k, (v / 3600).toFixed(2)])
        )
      },
      productivity: {
        mostProductiveHour,
        hourlyBreakdown: Object.fromEntries(
          Object.entries(hourlyBreakdown).map(([k, v]) => [k, (v / 3600).toFixed(2)])
        )
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get time series data for charts
router.get('/timeseries', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const timeTrackings = await TimeTracking.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Group by date
    const dailyData = {};
    timeTrackings.forEach(tracking => {
      const date = tracking.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, wakatime: 0, hackatime: 0, manual: 0 };
      }
      dailyData[date].total += tracking.duration;
      dailyData[date][tracking.source] += tracking.duration;
    });

    const series = Object.entries(dailyData).map(([date, data]) => ({
      date,
      totalHours: (data.total / 3600).toFixed(2),
      wakatimeHours: (data.wakatime / 3600).toFixed(2),
      hackatimeHours: (data.hackatime / 3600).toFixed(2),
      manualHours: (data.manual / 3600).toFixed(2)
    }));

    res.json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get project analytics
router.get('/projects', async (req, res) => {
  try {
    const timeTrackings = await TimeTracking.find({}).populate('eventId');

    const projectStats = timeTrackings.reduce((acc, tracking) => {
      const project = tracking.project || 'Unknown';
      if (!acc[project]) {
        acc[project] = {
          totalTime: 0,
          eventCount: 0,
          sources: {},
          activities: {}
        };
      }
      acc[project].totalTime += tracking.duration;
      acc[project].sources[tracking.source] = 
        (acc[project].sources[tracking.source] || 0) + tracking.duration;
      acc[project].activities[tracking.activity] = 
        (acc[project].activities[tracking.activity] || 0) + 1;
      return acc;
    }, {});

    const formatted = Object.entries(projectStats).map(([name, stats]) => ({
      name,
      totalHours: (stats.totalTime / 3600).toFixed(2),
      eventCount: stats.eventCount,
      sources: Object.fromEntries(
        Object.entries(stats.sources).map(([k, v]) => [k, (v / 3600).toFixed(2)])
      ),
      activities: stats.activities
    })).sort((a, b) => parseFloat(b.totalHours) - parseFloat(a.totalHours));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get goals and predictions
router.get('/goals', async (req, res) => {
  try {
    const currentDate = new Date();
    const monthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTrackings = await TimeTracking.find({
      timestamp: { $gte: monthAgo }
    });

    const totalHours = recentTrackings.reduce((sum, t) => sum + t.duration, 0) / 3600;
    const avgHoursPerDay = totalHours / 30;

    // Predict next 30 days
    const projectedHours = avgHoursPerDay * 30;

    // Calculate streaks
    const dailyActivity = {};
    recentTrackings.forEach(t => {
      const date = t.timestamp.toISOString().split('T')[0];
      dailyActivity[date] = true;
    });

    let currentStreak = 0;
    let tempDate = new Date();
    while (dailyActivity[tempDate.toISOString().split('T')[0]]) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }

    res.json({
      monthlyStats: {
        totalHours: totalHours.toFixed(2),
        avgHoursPerDay: avgHoursPerDay.toFixed(2),
        activeDays: Object.keys(dailyActivity).length,
        currentStreak
      },
      predictions: {
        projectedNextMonth: projectedHours.toFixed(2),
        estimatedDailyAvg: avgHoursPerDay.toFixed(2)
      },
      goals: {
        suggested: {
          daily: Math.ceil(avgHoursPerDay) + 1,
          weekly: Math.ceil(avgHoursPerDay * 7) + 5,
          monthly: Math.ceil(avgHoursPerDay * 30) + 20
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard stats (for gamification)
router.get('/leaderboard', async (req, res) => {
  try {
    const events = await Event.find({});
    
    const stats = {
      topCategories: Object.entries(
        events.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        }, {})
      ).sort(([, a], [, b]) => b - a).slice(0, 5),
      
      longestEvents: events
        .filter(e => e.endDate && e.startDate)
        .map(e => ({
          title: e.title,
          duration: (new Date(e.endDate) - new Date(e.startDate)) / (1000 * 60 * 60),
          category: e.category
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
      
      mostTrackedEvents: events
        .map(e => ({
          title: e.title,
          timeTracked: e.timeTracked / 3600,
          category: e.category
        }))
        .sort((a, b) => b.timeTracked - a.timeTracked)
        .slice(0, 5)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
