import { useState } from 'react';
import { seedDiscussionPosts } from '../data/seedPosts';
import { Database, AlertTriangle } from 'lucide-react';

export default function SeedButton() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ added: number; failed: number } | null>(null);

  const handleSeed = async () => {
    if (seeding || result) return;
    setSeeding(true);
    try {
      // seedDiscussionPosts used to swallow every per-post failure, so this
      // button printed "✓ 10 Discussion Posts Added!" after ten denials. It now
      // reports what actually happened.
      setResult(await seedDiscussionPosts());
    } catch (error) {
      console.error('Seeding failed:', error);
      setResult({ added: 0, failed: 10 });
    } finally {
      setSeeding(false);
    }
  };

  if (result) {
    const success = result.failed === 0;
    return (
      <div
        className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 ${
          success ? 'bg-green-500' : 'bg-amber-500'
        }`}
      >
        {success ? (
          <>✓ {result.added} Discussion Posts Added!</>
        ) : (
          <>
            <AlertTriangle size={14} />
            {result.added} added, {result.failed} failed — check you are signed in.
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleSeed}
      disabled={seeding}
      className="fixed bottom-4 right-4 bg-brand-emerald text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-brand-emerald/90 transition-all shadow-elevated disabled:opacity-50"
    >
      <Database size={16} />
      {seeding ? 'Seeding...' : 'Seed 10 Discussion Posts'}
    </button>
  );
}
