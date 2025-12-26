// Use dedicated API server (always online on Vercel)
const API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';

let charts = {};
let analyticsData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAllAnalytics();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('refreshDataBtn').addEventListener('click', loadAllAnalytics);
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportJSONBtn').addEventListener('click', exportToJSON);
    document.getElementById('exportPDFBtn').addEventListener('click', generatePDFReport);
}

async function loadAllAnalytics() {
    try {
        showLoading();
        
        await Promise.all([
            loadOverview(),
            loadTimeSeries(),
            loadProjects(),
            loadGoals()
        ]);

        hideLoading();
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics data', 'error');
    }
}

async function loadOverview() {
    try {
        const response = await fetch(`${API_URL}/analytics/overview`);
        const data = await response.json();
        analyticsData.overview = data;

        // Update summary cards
        document.getElementById('totalEvents').textContent = data.summary.totalEvents;
        document.getElementById('monthlyEvents').textContent = data.summary.monthlyEvents;
        document.getElementById('completionRate').textContent = `${data.summary.completionRate}%`;
        document.getElementById('completedEvents').textContent = data.summary.completedEvents;
        document.getElementById('totalTime').textContent = `${data.summary.totalTimeTracked / 3600}h`;
        document.getElementById('avgTime').textContent = `${data.summary.avgTimePerEvent}h`;

        // Create category chart
        createCategoryChart(data.breakdowns.byCategory);
        
        // Create priority chart
        createPriorityChart(data.breakdowns.byPriority);
        
        // Create source chart
        createSourceChart(data.breakdowns.bySource);
        
        // Create hourly chart
        createHourlyChart(data.productivity.hourlyBreakdown);

        // Update productive hour
        const productiveHour = parseInt(data.productivity.mostProductiveHour);
        document.getElementById('productiveHour').textContent = 
            `${productiveHour}:00 - ${productiveHour + 1}:00`;

    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

async function loadTimeSeries() {
    try {
        const response = await fetch(`${API_URL}/analytics/timeseries?days=30`);
        const data = await response.json();
        analyticsData.timeSeries = data;

        createTimeSeriesChart(data);
    } catch (error) {
        console.error('Error loading time series:', error);
    }
}

async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/analytics/projects`);
        const data = await response.json();
        analyticsData.projects = data;

        displayProjectsLeaderboard(data);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadGoals() {
    try {
        const response = await fetch(`${API_URL}/analytics/goals`);
        const data = await response.json();
        analyticsData.goals = data;

        // Update streak
        document.getElementById('currentStreak').textContent = data.monthlyStats.currentStreak;

        // Update goals
        updateGoalProgress('daily', data.monthlyStats.avgHoursPerDay, 4);
        updateGoalProgress('weekly', parseFloat(data.monthlyStats.totalHours) / 4, 25);
        updateGoalProgress('monthly', parseFloat(data.monthlyStats.totalHours), 100);

        // Update predictions
        document.getElementById('projectedHours').textContent = `${data.predictions.projectedNextMonth}h`;
        document.getElementById('suggestedGoal').textContent = `${data.goals.suggested.daily}h`;

    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

// Chart Creation Functions
function createTimeSeriesChart(data) {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    if (charts.timeSeries) {
        charts.timeSeries.destroy();
    }

    charts.timeSeries = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [
                {
                    label: 'Total Hours',
                    data: data.map(d => parseFloat(d.totalHours)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'WakaTime',
                    data: data.map(d => parseFloat(d.wakatimeHours)),
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'HackaTime',
                    data: data.map(d => parseFloat(d.hackatimeHours)),
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

function createCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (charts.category) {
        charts.category.destroy();
    }

    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: values,
                backgroundColor: [
                    '#667eea',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#ff8c37',
                    '#ec3750'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createPriorityChart(priorityData) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    if (charts.priority) {
        charts.priority.destroy();
    }

    charts.priority = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    priorityData.high || 0,
                    priorityData.medium || 0,
                    priorityData.low || 0
                ],
                backgroundColor: [
                    '#ec3750',
                    '#ff8c37',
                    '#33d6a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createSourceChart(sourceData) {
    const ctx = document.getElementById('sourceChart').getContext('2d');
    
    if (charts.source) {
        charts.source.destroy();
    }

    const labels = Object.keys(sourceData);
    const values = Object.values(sourceData).map(v => parseFloat(v));

    charts.source = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                label: 'Hours Tracked',
                data: values,
                backgroundColor: [
                    '#667eea',
                    '#f093fb',
                    '#43e97b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

function createHourlyChart(hourlyData) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (charts.hourly) {
        charts.hourly.destroy();
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const values = hours.map(h => parseFloat(hourlyData[h] || 0));

    charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Hours Tracked',
                data: values,
                backgroundColor: '#4facfe',
                borderColor: '#338eda',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hour of Day'
                    }
                }
            }
        }
    });
}

function displayProjectsLeaderboard(projects) {
    const container = document.getElementById('projectsLeaderboard');
    
    if (projects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No project data available</p>';
        return;
    }

    container.innerHTML = projects.slice(0, 10).map((project, index) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${project.name}</div>
                <div class="leaderboard-details">
                    ${Object.entries(project.sources).map(([source, hours]) => 
                        `${source}: ${hours}h`
                    ).join(' | ')}
                </div>
            </div>
            <div class="leaderboard-value">${project.totalHours}h</div>
        </div>
    `).join('');
}

function updateGoalProgress(period, current, goal) {
    const percentage = Math.min((current / goal) * 100, 100);
    const circle = document.getElementById(`${period}Progress`);
    const text = document.getElementById(`${period}GoalText`);
    const details = document.getElementById(`${period}GoalDetails`);

    // Update circle progress
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Update text
    text.textContent = `${percentage.toFixed(0)}%`;
    details.textContent = `${current.toFixed(1)}h / ${goal}h`;

    // Change color based on progress
    if (percentage >= 100) {
        circle.style.stroke = '#33d6a6';
    } else if (percentage >= 75) {
        circle.style.stroke = '#4facfe';
    } else if (percentage >= 50) {
        circle.style.stroke = '#ff8c37';
    } else {
        circle.style.stroke = '#667eea';
    }
}

// Export Functions
function exportToCSV() {
    if (!analyticsData.overview) {
        showNotification('No data to export', 'error');
        return;
    }

    let csv = 'Analytics Report\n\n';
    csv += 'Summary\n';
    csv += `Total Events,${analyticsData.overview.summary.totalEvents}\n`;
    csv += `Completed Events,${analyticsData.overview.summary.completedEvents}\n`;
    csv += `Completion Rate,${analyticsData.overview.summary.completionRate}%\n`;
    csv += `Total Time Tracked (hours),${(analyticsData.overview.summary.totalTimeTracked / 3600).toFixed(2)}\n\n`;

    csv += 'Category Breakdown\n';
    Object.entries(analyticsData.overview.breakdowns.byCategory).forEach(([cat, count]) => {
        csv += `${cat},${count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showNotification('CSV exported successfully!', 'success');
}

function exportToJSON() {
    const json = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    showNotification('JSON exported successfully!', 'success');
}

function generatePDFReport() {
    showNotification('PDF generation feature coming soon!', 'info');
    // This would integrate with a library like jsPDF
}

function showLoading() {
    document.getElementById('refreshDataBtn').innerHTML = '<span class="loading-spinner"></span> Loading...';
}

function hideLoading() {
    document.getElementById('refreshDataBtn').innerHTML = '🔄 Refresh Data';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#33d6a6' : type === 'error' ? '#ec3750' : '#338eda'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
