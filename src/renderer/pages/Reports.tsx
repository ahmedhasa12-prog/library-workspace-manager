import React, { useState, useEffect } from 'react';
import { electronAPI } from '../../main/preload';
import { Button } from '../components/Button';
import { utils } from '../../main/preload';

const Reports: React.FC = () => {
  const [sessions, setSessions] = useState<Array<any>>([]);
  const [customers, setCustomers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, customersData] = await Promise.all([
        electronAPI.getSessions(),
        electronAPI.getCustomers()
      ]);
      setSessions(sessionsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load reports data:', error);
      alert('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.check_in_time).toISOString().split('T')[0];
    const startMatch = !dateRange.start || sessionDate >= dateRange.start;
    const endMatch = !dateRange.end || sessionDate <= dateRange.end;
    return startMatch && endMatch;
  });

  const calculateStats = () => {
    const totalRevenue = filteredSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalSessions = filteredSessions.length;
    const activeSessions = filteredSessions.filter(s => s.status === 'active').length;
    const avgSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    
    return {
      totalRevenue,
      totalSessions,
      activeSessions,
      avgSessionValue
    };
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="page-actions">
          <div className="date-range">
            <label>From:</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <label>To:</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
            <Button variant="outline" onClick={() => {/* Apply filters */}}>
              Apply
            </Button>
            <Button variant="secondary" onClick={() => setDateRange({ start: '', end: '' })}>
              Clear
            </Button>
          </div>
          <Button variant="primary" onClick={() => {/* Export report */}}>
            Export Report
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : (
        <div className="reports-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p className="summary-value">${calculateStats().totalRevenue.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Sessions</h3>
              <p className="summary-value">{calculateStats().totalSessions}</p>
            </div>
            <div className="summary-card">
              <h3>Active Sessions</h3>
              <p className="summary-value">{calculateStats().activeSessions}</p>
            </div>
            <div className="summary-card">
              <h3>Avg. Session Value</h3>
              <p className="summary-value">${calculateStats().avgSessionValue.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Sessions Chart Placeholder */}
          <div className="chart-placeholder">
            <h3>Sessions Over Time</h3>
            <div className="chart-container">
              {/* In a real app, this would be a chart using Chart.js or similar */}
              <div className="chart-info">
                Chart showing daily session counts would appear here
              </div>
            </div>
          </div>
          
          {/* Recent Sessions Table */}
          <div className="recent-sessions">
            <h3>Recent Sessions</h3>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.slice(0, 10).map(session => (
                  <tr key={session.id}>
                    <td>{session.customer_name}</td>
                    <td>{utils.formatDate(session.check_in_time)}</td>
                    <td>
                      {session.duration_minutes} min 
                      ({Math.round(session.duration_minutes / 60)}h)
                    </td>
                    <td>${(session.total_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${session.status}`}>
                        {session.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">No sessions found for selected period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;