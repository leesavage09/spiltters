import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useHealth } from "../hooks/useHealth";
import { useSplits } from "../hooks/useSplits";
import CreateSplitModal from "../components/CreateSplitModal";

const Home: FC = () => {
  const { data, isLoading, error } = useHealth();
  const { data: user } = useCurrentUser();
  const { mutate: logoutMutate } = useLogout();
  const {
    data: splits,
    isLoading: splitsLoading,
    error: splitsError,
  } = useSplits();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
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

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Your Splits</h2>

          {splitsLoading ? (
            <div className="animate-pulse text-slate-400 text-sm">
              Loading splits...
            </div>
          ) : splitsError ? (
            <div className="text-red-400 text-sm">Failed to load splits</div>
          ) : splits && splits.length > 0 ? (
            <ul className="space-y-2">
              {splits.map((split) => (
                <li key={split.id}>
                  <Link
                    to={`/splits/${split.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 transition hover:bg-slate-800 active:bg-slate-700 cursor-pointer"
                  >
                    <span className="text-xl">{split.emoji}</span>
                    <span className="text-sm font-medium text-slate-200 flex-1">
                      {split.name}
                    </span>
                    <svg
                      className="h-4 w-4 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm mb-4">No splits yet</p>
          )}
          <div className="text-center py-8">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Create new split
            </button>
          </div>
        </div>
      </main>

      <CreateSplitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Home;
