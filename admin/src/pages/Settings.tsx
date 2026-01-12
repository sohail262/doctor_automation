import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  Zap,
  Save,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useSystemSettings } from '@/hooks/useSystemHealth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { SystemSettings } from '@/types/admin';
import toast from 'react-hot-toast';

const Settings = () => {
  const { hasPermission } = useAdminAuth();
  const { settings, loading, saving, update } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'automation' | 'notifications' | 'security'>('general');
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    try {
      await update(localSettings);
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const updateLocalSettings = (path: string, value: any) => {
    if (!localSettings) return;

    const keys = path.split('.');
    const newSettings = JSON.parse(JSON.stringify(localSettings));
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  if (loading || !settings) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-dark-800 rounded"></div>
          <div className="h-96 bg-dark-800 rounded-xl"></div>
        </div>
      </Layout>
    );
  }

  const currentSettings = localSettings || settings;
  const canEdit = hasPermission('settings', 'edit');

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'automation', name: 'Automation', icon: Zap },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">System Settings</h1>
            <p className="text-dark-400 mt-1">Configure platform-wide settings</p>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="btn-primary"
            >
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center">
            <AlertTriangle className="text-yellow-400 mr-3" size={20} />
            <span className="text-yellow-400">You have unsaved changes</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                    }`}
                >
                  <tab.icon size={18} className="mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-semibold text-dark-100">General Settings</h2>

                <div>
                  <label className="label">Application Name</label>
                  <input
                    type="text"
                    value={currentSettings.general.appName}
                    onChange={(e) => updateLocalSettings('general.appName', e.target.value)}
                    className="input"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="label">Support Email</label>
                  <input
                    type="email"
                    value={currentSettings.general.supportEmail}
                    onChange={(e) => updateLocalSettings('general.supportEmail', e.target.value)}
                    className="input"
                    disabled={!canEdit}
                  />
                </div>

                <div className="pt-4 border-t border-dark-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-dark-100">Maintenance Mode</h3>
                      <p className="text-sm text-dark-400">
                        Enable to prevent users from accessing the platform
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateLocalSettings(
                          'general.maintenanceMode',
                          !currentSettings.general.maintenanceMode
                        )
                      }
                      disabled={!canEdit}
                      className="text-dark-400 hover:text-dark-100"
                    >
                      {currentSettings.general.maintenanceMode ? (
                        <ToggleRight size={32} className="text-red-400" />
                      ) : (
                        <ToggleLeft size={32} />
                      )}
                    </button>
                  </div>

                  {currentSettings.general.maintenanceMode && (
                    <div className="mt-4">
                      <label className="label">Maintenance Message</label>
                      <textarea
                        value={currentSettings.general.maintenanceMessage || ''}
                        onChange={(e) =>
                          updateLocalSettings('general.maintenanceMessage', e.target.value)
                        }
                        className="input h-24"
                        placeholder="We're currently performing maintenance..."
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Automation Settings */}
            {activeTab === 'automation' && (
              <div className="space-y-6">
                <div className="card space-y-6">
                  <h2 className="text-lg font-semibold text-dark-100">Automation Settings</h2>

                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <h3 className="font-medium text-dark-100">Global Pause</h3>
                      <p className="text-sm text-dark-400">
                        Pause all automated workflows across the platform
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateLocalSettings(
                          'automation.globalPause',
                          !currentSettings.automation.globalPause
                        )
                      }
                      disabled={!canEdit}
                      className="text-dark-400 hover:text-dark-100"
                    >
                      {currentSettings.automation.globalPause ? (
                        <ToggleRight size={32} className="text-red-400" />
                      ) : (
                        <ToggleLeft size={32} className="text-emerald-400" />
                      )}
                    </button>
                  </div>

                  {currentSettings.automation.globalPause && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="text-red-400 mr-2" size={20} />
                        <span className="text-red-400 font-medium">
                          All automations are currently paused
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Default Batch Size</label>
                      <input
                        type="number"
                        value={currentSettings.automation.defaultBatchSize}
                        onChange={(e) =>
                          updateLocalSettings(
                            'automation.defaultBatchSize',
                            parseInt(e.target.value)
                          )
                        }
                        className="input"
                        min={1}
                        max={500}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-dark-500 mt-1">
                        Number of doctors processed per batch
                      </p>
                    </div>
                    <div>
                      <label className="label">Max Retries</label>
                      <input
                        type="number"
                        value={currentSettings.automation.maxRetries}
                        onChange={(e) =>
                          updateLocalSettings('automation.maxRetries', parseInt(e.target.value))
                        }
                        className="input"
                        min={0}
                        max={10}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-dark-500 mt-1">
                        Retry count for failed operations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card space-y-6">
                  <h2 className="text-lg font-semibold text-dark-100">Rate Limits</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Posts per Hour</label>
                      <input
                        type="number"
                        value={currentSettings.automation.rateLimits.postsPerHour}
                        onChange={(e) =>
                          updateLocalSettings(
                            'automation.rateLimits.postsPerHour',
                            parseInt(e.target.value)
                          )
                        }
                        className="input"
                        min={1}
                        max={10000}
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <label className="label">API Calls per Minute</label>
                      <input
                        type="number"
                        value={currentSettings.automation.rateLimits.apiCallsPerMinute}
                        onChange={(e) =>
                          updateLocalSettings(
                            'automation.rateLimits.apiCallsPerMinute',
                            parseInt(e.target.value)
                          )
                        }
                        className="input"
                        min={1}
                        max={1000}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-semibold text-dark-100">Notification Settings</h2>

                <div>
                  <label className="label">Admin Notification Emails</label>
                  <textarea
                    value={currentSettings.notifications.adminEmails.join('\n')}
                    onChange={(e) =>
                      updateLocalSettings(
                        'notifications.adminEmails',
                        e.target.value.split('\n').filter((email) => email.trim())
                      )
                    }
                    className="input h-24"
                    placeholder="admin@example.com&#10;support@example.com"
                    disabled={!canEdit}
                  />
                  <p className="text-xs text-dark-500 mt-1">One email per line</p>
                </div>

                <div>
                  <label className="label">Slack Webhook URL (Optional)</label>
                  <input
                    type="url"
                    value={currentSettings.notifications.slackWebhook || ''}
                    onChange={(e) =>
                      updateLocalSettings('notifications.slackWebhook', e.target.value || undefined)
                    }
                    className="input"
                    placeholder="https://hooks.slack.com/services/..."
                    disabled={!canEdit}
                  />
                </div>

                <div className="pt-4 border-t border-dark-800">
                  <h3 className="font-medium text-dark-100 mb-4">Alert Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Error Rate (%)</label>
                      <input
                        type="number"
                        value={currentSettings.notifications.alertThresholds.errorRate}
                        onChange={(e) =>
                          updateLocalSettings(
                            'notifications.alertThresholds.errorRate',
                            parseInt(e.target.value)
                          )
                        }
                        className="input"
                        min={1}
                        max={100}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-dark-500 mt-1">
                        Alert when error rate exceeds this percentage
                      </p>
                    </div>
                    <div>
                      <label className="label">Failed Jobs Threshold</label>
                      <input
                        type="number"
                        value={currentSettings.notifications.alertThresholds.failedJobs}
                        onChange={(e) =>
                          updateLocalSettings(
                            'notifications.alertThresholds.failedJobs',
                            parseInt(e.target.value)
                          )
                        }
                        className="input"
                        min={1}
                        max={1000}
                        disabled={!canEdit}
                      />
                      <p className="text-xs text-dark-500 mt-1">
                        Alert when failed jobs exceed this count
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-semibold text-dark-100">Security Settings</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={currentSettings.security.sessionTimeout}
                      onChange={(e) =>
                        updateLocalSettings('security.sessionTimeout', parseInt(e.target.value))
                      }
                      className="input"
                      min={5}
                      max={1440}
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <label className="label">Max Login Attempts</label>
                    <input
                      type="number"
                      value={currentSettings.security.maxLoginAttempts}
                      onChange={(e) =>
                        updateLocalSettings(
                          'security.maxLoginAttempts',
                          parseInt(e.target.value)
                        )
                      }
                      className="input"
                      min={1}
                      max={10}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">IP Whitelist (Optional)</label>
                  <textarea
                    value={currentSettings.security.ipWhitelist.join('\n')}
                    onChange={(e) =>
                      updateLocalSettings(
                        'security.ipWhitelist',
                        e.target.value.split('\n').filter((ip) => ip.trim())
                      )
                    }
                    className="input h-24"
                    placeholder="192.168.1.1&#10;10.0.0.0/8"
                    disabled={!canEdit}
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    One IP or CIDR range per line. Leave empty to allow all IPs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;