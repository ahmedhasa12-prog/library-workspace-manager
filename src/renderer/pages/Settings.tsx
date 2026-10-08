import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editedKey, setEditedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await window.api.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await window.api.settings.set(key, value);
      await loadSettings();
      toast.success('Setting updated successfully!');
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleBackup = async () => {
    try {
      const saved = await window.api.backup();
      if (saved) toast.success('Backup saved!');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup failed');
    }
  };

  const handleEditSetting = (key: string) => {
    setEditedKey(key);
    setEditValue(settings[key] || '');
  };

  const handleSaveSetting = async () => {
    if (editedKey !== null) {
      await handleUpdateSetting(editedKey, editValue);
      setEditedKey(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditedKey(null);
    setEditValue('');
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={handleBackup}>
            Backup Data
          </Button>
          <Button variant="outline" onClick={() => {/* Restore data */}}>
            Restore Data
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading settings...</div>
      ) : (
        <div>
          <div>
            <div className="settings-grid">
              <div className="settings-section">
                <h2>General Settings</h2>
                <div className="settings-list">
                  {Object.entries(settings).map(([key, value]) => (
                    <div key={key} className="setting-item">
                      <div className="setting-info">
                        <h3>{key.replace(/_/g, ' ').toUpperCase()}</h3>
                        <p className="setting-description">
                          Configure {key.replace(/_/g, ' ')} for the library workspace
                        </p>
                      </div>
                      {editedKey === key ? (
                        <div className="setting-edit">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Enter new value"
                            className="setting-input"
                          />
                          <div className="setting-actions">
                            <Button 
                              variant="primary" 
                              onClick={handleSaveSetting}
                            >
                              Save
                            </Button>
                            <Button 
                              variant="secondary" 
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="setting-value">
                            <span className="value-label">Current Value:</span>
                            <span className="value-text">{value}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="small" 
                            onClick={() => handleEditSetting(key)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="settings-section">
                <h2>Database Information</h2>
                <div className="db-info">
                  <p><strong>Database File:</strong> library.db</p>
                  <p><strong>Location:</strong> Application directory</p>
                  <p><strong>Last Backup:</strong> Never (consider backing up regularly)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;