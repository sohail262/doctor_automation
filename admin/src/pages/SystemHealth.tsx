import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cloud,
  Wifi,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useSystemHealth, useAPIKeys } from '@/hooks/useSystemHealth';
import { format } from 'date-fns';

const SystemHealth = () => {
  const { health, loading, refresh } = useSystemHealth();
  const { keys, testing, test } = useAPIKeys();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'degraded':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'down':
        return <AlertCircle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-dark-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'down':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-dark-400 bg-dark-400/10 border-dark-400/20';
    }
  };

  const getServiceIcon = (name: string) => {
    const icons: Record<string, JSX.Element> = {
      Firestore: <Database className="text-blue-400" size={20} />,
      'Cloud Functions': <Cloud className="text-purple-400" size={20} />,
      'Pub/Sub': <Wifi className="text-green-400" size={20} />,
      OpenAI: <Server className="text-emerald-400" size={20} />,
      Replicate: <Server className="text-pink-400" size={20} />,
      Twilio: <Server className="text-red-400" size={20} />,
      'Google APIs': <Server className="text-blue-400" size={20} />,
    };
    return icons[name] || <Server className="text-dark-400" size={20} />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">System Health</h1>
            <p className="text-dark-400 mt-1">Monitor platform services and APIs</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm text-dark-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-dark-600 bg-dark-800 text-primary-600"
              />
              <span>Auto-refresh (30s)</span>
            </label>
            <button onClick={refresh} disabled={loading} className="btn-secondary">
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Status */}
        <div
          className={`card border ${health ? getStatusColor(health.status) : 'border-dark-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center ${health?.status === 'healthy'
                    ? 'bg-emerald-400/20'
                    : health?.status === 'degraded'
                      ? 'bg-yellow-400/20'
                      : 'bg-red-400/20'
                  }`}
              >
                <Activity
                  size={32}
                  className={
                    health?.status === 'healthy'
                      ? 'text-emerald-400'
                      : health?.status === 'degraded'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-100">
                  System {health?.status === 'healthy' ? 'Operational' : health?.status === 'degraded' ? 'Degraded' : 'Down'}
                </h2>
                <p className="text-dark-400 mt-1">
                  Last checked:{' '}
                  {health?.lastCheckedAt
                    ? format(
                      health.lastCheckedAt?.toDate?.() ||
                      new Date(health.lastCheckedAt as any),
                      'MMM d, h:mm:ss a'
                    )
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-dark-400">Services</p>
              <p className="text-2xl font-bold text-dark-100">
                {health?.services?.filter((s) => s.status === 'healthy').length || 0}/
                {health?.services?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health?.services?.map((service) => (
            <div
              key={service.name}
              className={`card border ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getServiceIcon(service.name)}
                  <h3 className="font-semibold text-dark-100">{service.name}</h3>
                </div>
                {getStatusIcon(service.status)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Status</span>
                  <span
                    className={`font-medium capitalize ${service.status === 'healthy'
                        ? 'text-emerald-400'
                        : service.status === 'degraded'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                  >
                    {service.status}
                  </span>
                </div>
                {service.latency !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Latency</span>
                    <span
                      className={`font-medium ${service.latency < 100
                          ? 'text-emerald-400'
                          : service.latency < 500
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                    >
                      {service.latency}ms
                    </span>
                  </div>
                )}
                {service.lastError && (
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
                    {service.lastError}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* API Keys Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">API Keys Status</h2>
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-dark-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {getServiceIcon(key.service)}
                  <div>
                    <h3 className="font-medium text-dark-100">{key.name}</h3>
                    <p className="text-sm text-dark-500">
                      {key.service} • {key.keyPreview}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-dark-400">Usage</p>
                    <p className="font-medium text-dark-200">
                      {key.usageCount.toLocaleString()}
                      {key.usageLimit && ` / ${key.usageLimit.toLocaleString()}`}
                    </p>
                  </div>
                  <span
                    className={`badge ${key.status === 'active'
                        ? 'badge-success'
                        : key.status === 'expired'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                  >
                    {key.status}
                  </span>
                  <button
                    onClick={() => test(key.service)}
                    disabled={testing === key.service}
                    className="btn-secondary btn-sm"
                  >
                    {testing === key.service ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Recent Incidents</h2>
          <div className="text-center py-8 text-dark-400">
            <CheckCircle className="mx-auto mb-3 text-emerald-400" size={32} />
            <p>No recent incidents</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemHealth;