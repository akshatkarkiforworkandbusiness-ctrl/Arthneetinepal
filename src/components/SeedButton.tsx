import { useState } from 'react';
import { seedDiscussionPosts } from '../data/seedPosts';
import { Database } from 'lucide-react';

export default function SeedButton() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    if (seeding || done) return;
    setSeeding(true);
    await seedDiscussionPosts();
    setSeeding(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
        ✓ 10 Discussion Posts Added!
      </div>
    );
  }

  return (
    <button
      onClick={handleSeed}
      disabled={seeding}
      className="fixed bottom-4 right-4 bg-coral-flame text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-coral-flame/90 transition-colors disabled:opacity-50"
    >
      <Database size={16} />
      {seeding ? 'Seeding...' : 'Seed 10 Discussion Posts'}
    </button>
  );
}
