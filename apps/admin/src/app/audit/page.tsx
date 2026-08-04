import { adminApi } from '@/lib/api';

export default async function AuditPage() {
  let logs: Array<{ id: string; action: string; resource_type: string; created_at: string; details: object }> = [];
  try {
    logs = await adminApi.getAuditLog();
  } catch {
    // API not running
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Audit Log</h1>

      {logs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-400">No audit entries yet</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left p-4 font-medium">Time</th>
                <th className="text-left p-4 font-medium">Action</th>
                <th className="text-left p-4 font-medium">Resource</th>
                <th className="text-left p-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-4 text-zinc-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 text-white font-medium">{log.action}</td>
                  <td className="p-4 text-zinc-400">{log.resource_type}</td>
                  <td className="p-4 text-zinc-500 font-mono text-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
