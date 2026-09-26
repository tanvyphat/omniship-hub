import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl [animation:omni-float_10s_ease-in-out_infinite]" />
        <div className="absolute right-10 top-32 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl [animation:omni-float_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-fuchsia-300/15 blur-3xl [animation:omni-float_14s_ease-in-out_infinite]" />
      </div>

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="relative z-10 h-screen min-w-0 overflow-y-auto overflow-x-hidden md:ml-64">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] p-4 md:p-8">
          <div className="animate-[omni-page-in_420ms_ease-out]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
