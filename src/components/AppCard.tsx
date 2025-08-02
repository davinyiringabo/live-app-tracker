'use client';

import { useState } from 'react';
import { App } from '@/lib/database';
import { formatDate, getStatusColor, getStatusIcon, cn } from '@/lib/utils';
import { Trash2, Edit, Eye, RefreshCw } from 'lucide-react';

interface AppCardProps {
  app: App;
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
  onViewLogs: (id: number) => void;
  onManualCheck: (id: number) => void;
}

export default function AppCard({ app, onEdit, onDelete, onViewLogs, onManualCheck }: AppCardProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await onManualCheck(app.id);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              getStatusColor(app.last_status)
            )}>
              {getStatusIcon(app.last_status)} {app.last_status || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-600 break-all">{app.url}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            title="Manual check"
          >
            <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
          </button>
          <button
            onClick={() => onViewLogs(app.id)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="View logs"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(app)}
            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
            title="Edit app"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(app.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete app"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Last Check</p>
          <p className="font-medium">
            {app.last_check ? formatDate(app.last_check) : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Check Interval</p>
          <p className="font-medium">{app.check_interval} minutes</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-medium">
            {app.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Created</p>
          <p className="font-medium">{formatDate(app.created_at)}</p>
        </div>
      </div>
    </div>
  );
} 