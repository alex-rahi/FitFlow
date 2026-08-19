'use client';

import { useEffect, useState } from 'react';
import { adminApi, ReviewItem } from '@/lib/api';

const MODEL_VERSIONS = {
  yolo: 'yolov8n-gym-v1.0',
  moderation: 'gymtok-moderation-v2.1',
  safety: 'gymtok-safety-v1.0',
};

function BoundingBoxOverlay({ detections }: { detections: ReviewItem['detections'] }) {
  return (
    <div className="relative w-full h-full">
      {detections.map((d, i) => {
        const bb = d.bounding_box as { x1?: number; y1?: number; x2?: number; y2?: number } | undefined;
        if (!bb?.x1) return null;
        const left = (bb.x1 / 500) * 100;
        const top = (bb.y1 / 600) * 100;
        const width = ((bb.x2! - bb.x1) / 500) * 100;
        const height = ((bb.y2! - bb.y1) / 600) * 100;
        return (
          <div
            key={i}
            className="absolute border-2 border-red-500 rounded-sm"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
          >
            <span className="absolute -top-5 left-0 text-[10px] bg-red-600 text-white px-1 rounded whitespace-nowrap">
              {d.label} {(d.confidence * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = () => {
    setLoading(true);
    adminApi.getReviewQueue()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadQueue, []);

  const handleAction = async (action: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.submitReview(selected.id, action, notes || undefined);
      setSelected(null);
      setNotes('');
      loadQueue();
    } catch (err) {
      alert('Action failed — is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Review Queue</h1>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-400 text-lg">No items pending review</p>
          <p className="text-zinc-600 text-sm mt-2">Videos flagged by the AI pipeline will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === item.id
                    ? 'border-red-600 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">
                        @{item.post?.author?.username ?? 'unknown'}
                      </p>
                      {item.post?.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-medium">
                          {item.post.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-1 line-clamp-2">
                      {item.post?.caption ?? 'No caption'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.priority >= 10 ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    P{item.priority}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="aspect-video bg-zinc-800 rounded-lg relative overflow-hidden mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-zinc-600 text-sm">Video frame @ t=2.0s</p>
                </div>
                <BoundingBoxOverlay detections={selected.detections} />
              </div>

              <div className="flex gap-4 mb-6 text-xs text-zinc-500">
                <span>YOLO: <code className="text-zinc-400">{MODEL_VERSIONS.yolo}</code></span>
                <span>Moderation: <code className="text-zinc-400">{MODEL_VERSIONS.moderation}</code></span>
                <span>Safety: <code className="text-zinc-400">{MODEL_VERSIONS.safety}</code></span>
              </div>

              <h3 className="text-white font-semibold mb-3">AI Detections</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {selected.detections.map((d, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300">
                    {d.label} @ {(d.confidence * 100).toFixed(0)}%
                    {d.bounding_box && ' · bbox'}
                  </span>
                ))}
                {selected.detections.length === 0 && (
                  <span className="text-zinc-500 text-sm">No detections</span>
                )}
              </div>

              <h3 className="text-white font-semibold mb-3">Moderation Scores</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {selected.moderation_scores.map((s, i) => (
                  <div key={i} className="flex justify-between px-3 py-2 bg-zinc-800 rounded-lg text-sm">
                    <span className="text-zinc-400">{s.category}</span>
                    <span className={s.score > 0.7 ? 'text-red-400' : s.score > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                      {(s.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reviewer notes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 mb-4 resize-none h-20"
              />

              <div className="flex gap-3">
                <ActionButton label="Approve" color="green" onClick={() => handleAction('publish')} disabled={submitting} />
                <ActionButton label="Reject" color="red" onClick={() => handleAction('reject')} disabled={submitting} />
                <ActionButton label="Flag" color="yellow" onClick={() => handleAction('flag_for_review')} disabled={submitting} />
                <ActionButton label="Age Restrict" color="orange" onClick={() => handleAction('age_restrict')} disabled={submitting} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, color, onClick, disabled }: {
  label: string; color: string; onClick: () => void; disabled: boolean;
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {label}
    </button>
  );
}
