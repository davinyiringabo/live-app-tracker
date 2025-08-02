'use client';

import { useState, useEffect } from 'react';
import { Plus, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { App } from '@/lib/database';
import AppCard from '@/components/AppCard';
import AddAppModal from '@/components/AddAppModal';
import LogsModal from '@/components/LogsModal';

export default function Home() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedAppName, setSelectedAppName] = useState<string>('');
  const [isAddingApp, setIsAddingApp] = useState(false);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apps');
      const data = await response.json();
      if (data.apps) {
        setApps(data.apps);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleAddApp = async (data: { name: string; url: string; checkInterval: number }) => {
    setIsAddingApp(true);
    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchApps(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to add app: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to add app:', error);
      alert('Failed to add app. Please try again.');
    } finally {
      setIsAddingApp(false);
    }
  };

  const handleEditApp = () => {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
  };

  const handleDeleteApp = async (id: number) => {
    if (!confirm('Are you sure you want to delete this app?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApps(); // Refresh the list
      } else {
        alert('Failed to delete app. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete app:', error);
      alert('Failed to delete app. Please try again.');
    }
  };

  const handleViewLogs = (id: number) => {
    const app = apps.find(a => a.id === id);
    if (app) {
      setSelectedAppId(id);
      setSelectedAppName(app.name);
      setShowLogsModal(true);
    }
  };

  const handleManualCheck = async (id: number) => {
    try {
      const response = await fetch('/api/monitor/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId: id }),
      });

      if (response.ok) {
        // Wait a bit for the check to complete, then refresh
        setTimeout(() => {
          fetchApps();
        }, 2000);
      } else {
        alert('Failed to run manual check. Please try again.');
      }
    } catch (error) {
      console.error('Failed to run manual check:', error);
      alert('Failed to run manual check. Please try again.');
    }
  };

  const stats = {
    total: apps.length,
    up: apps.filter(app => app.last_status === 'up').length,
    down: apps.filter(app => app.last_status === 'down').length,
    unknown: apps.filter(app => app.last_status === null).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">App Live Tracker</h1>
              <p className="text-gray-600">Monitor your applications and get instant alerts</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add App
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Apps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Up</p>
                <p className="text-2xl font-bold text-green-600">{stats.up}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Down</p>
                <p className="text-2xl font-bold text-red-600">{stats.down}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">?</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unknown</p>
                <p className="text-2xl font-bold text-gray-600">{stats.unknown}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        {apps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No apps yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first application to monitor.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First App
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onEdit={handleEditApp}
                onDelete={handleDeleteApp}
                onViewLogs={handleViewLogs}
                onManualCheck={handleManualCheck}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAppModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddApp}
        isLoading={isAddingApp}
      />

      {selectedAppId && (
        <LogsModal
          isOpen={showLogsModal}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedAppId(null);
            setSelectedAppName('');
          }}
          appId={selectedAppId}
          appName={selectedAppName}
        />
      )}
    </div>
  );
}
