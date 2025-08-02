/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { CheckLog } from '@/lib/database';
import { formatDate, formatResponseTime, getStatusColor, getStatusIcon, cn } from '@/lib/utils';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  appName: string;
}

export default function LogsModal({ isOpen, onClose, appId, appName }: LogsModalProps) {
  const [logs, setLogs] = useState<CheckLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/apps/${appId}/logs?limit=100`);
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && appId) {
      fetchLogs();
    }
  }, [isOpen, appId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Check Logs - {appName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs found for this app.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        getStatusColor(log.status)
                      )}>
                        {getStatusIcon(log.status)} {log.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.checked_at)}
                      </span>
                    </div>
                    {log.response_time !== null && (
                      <span className="text-sm text-gray-600">
                        {formatResponseTime(log.response_time)}
                      </span>
                    )}
                  </div>
                  
                  {log.error_message && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700 font-medium">Error:</p>
                      <p className="text-sm text-red-600">{log.error_message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {logs.length} most recent check logs
          </p>
        </div>
      </div>
    </div>
  );
} 