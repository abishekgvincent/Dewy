import Sidebar from "./sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pl-72 bg-slate-100 dark:bg-zinc-950 font-sans">
      <Sidebar />
      <main className="min-h-screen py-6 px-8 max-w-[96rem] mx-auto flex flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
