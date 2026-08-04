import { adminApi, ModerationStats } from '@/lib/api';
import { USE_PLACEHOLDERS } from '@/lib/placeholders';

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <p className="text-zinc-500 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const stats: ModerationStats = await adminApi.getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {USE_PLACEHOLDERS && (
        <div className="mb-6 px-4 py-3 bg-red-600/20 border border-red-600/40 rounded-lg text-red-400 text-sm">
          Demo mode — showing placeholder data. Replace credentials in <code className="text-red-300">.env</code> and set{' '}
          <code className="text-red-300">USE_PLACEHOLDERS=false</code> to connect live services.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Posts" value={stats.total_posts} />
        <StatCard label="Pending Review" value={stats.pending_review} color="text-yellow-400" />
        <StatCard label="Approved" value={stats.approved} color="text-green-400" />
        <StatCard label="Rejected" value={stats.rejected} color="text-red-400" />
        <StatCard label="Flagged" value={stats.flagged} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-3">
            <HealthRow label="Backend API" status={USE_PLACEHOLDERS ? 'Placeholder mode' : 'Live'} />
            <HealthRow label="AI Worker" status="Polls processing_jobs queue" />
            <HealthRow label="Database" status="PostgreSQL via Supabase" />
            <HealthRow label="Storage" status="Supabase Storage buckets" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Processing Pipeline</h2>
          <ol className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">1</span> User uploads video</li>
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">2</span> Frame extraction</li>
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">3</span> YOLO object detection</li>
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">4</span> Content moderation</li>
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">5</span> Business rules evaluation</li>
            <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs text-white">6</span> Approve / Reject / Review</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-300 text-sm">{label}</span>
      <span className="text-zinc-500 text-xs">{status}</span>
    </div>
  );
}
