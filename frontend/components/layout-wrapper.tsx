import Sidebar from "./sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pl-64 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Sidebar />
      <main className="min-h-screen py-8 px-8 max-w-7xl mx-auto flex flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
