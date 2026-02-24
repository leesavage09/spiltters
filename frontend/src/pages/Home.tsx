import type { FC } from "react";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useHealth } from "../hooks/useHealth";

const Home: FC = () => {
  const { data, isLoading, error } = useHealth();
  const { data: user } = useCurrentUser();
  const { mutate: logoutMutate } = useLogout();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-lg">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight">Splitters</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{user.email}</span>
              <button
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                onClick={() => {
                  logoutMutate();
                }}
                type="button"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <p className="text-sm text-slate-300">
              Backend Status:{" "}
              <span className="font-semibold text-emerald-400">
                {data?.status}
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
