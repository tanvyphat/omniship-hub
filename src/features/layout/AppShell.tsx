import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
