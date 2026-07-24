import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { ShieldAlert, Terminal } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Retrieving security audit trail..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security & System Audit Trail</h1>
          <p className="text-xs text-slate-500">Immutable logging of user authentication, transfer executions, and administrative events</p>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs overflow-x-auto">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-slate-800 pb-3">
          <Terminal className="w-4 h-4" />
          <span>AUDIT_LOG_BUFFER (SYS_READ)</span>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.log_id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span className="text-emerald-400 font-bold">[{new Date(log.timestamp).toLocaleString()}]</span>
                <span className="text-amber-400 font-bold">ACTION: {log.action}</span>
              </div>
              <p className="text-slate-200">{log.details}</p>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>User: {log.email || 'Anonymous'} ({log.role || 'Guest'})</span>
                <span>IP: {log.ip_address}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
