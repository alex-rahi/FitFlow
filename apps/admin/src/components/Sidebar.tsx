import Link from 'next/link';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/review', label: 'Review Queue' },
  { href: '/audit', label: 'Audit Log' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col min-h-screen">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white text-sm">
            GT
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">GymTok</h1>
            <p className="text-zinc-500 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm font-medium"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
