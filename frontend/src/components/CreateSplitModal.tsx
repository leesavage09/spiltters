import type { FC } from "react";
import { useEffect, useState } from "react";
import { useCreateSplit } from "../hooks/useSplits";

interface CreateSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSplitModal: FC<CreateSplitModalProps> = ({ isOpen, onClose }) => {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const { mutate, isPending, error, reset } = useCreateSplit();

  useEffect(() => {
    if (isOpen) {
      setEmoji("");
      setName("");
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    mutate({ name, emoji }, { onSuccess: onClose });
  };

  const serverError = error?.response?.data.message;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-5">
          Create new split
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="emoji"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Emoji
            </label>
            <input
              id="emoji"
              type="text"
              value={emoji}
              onChange={(e) => {
                setEmoji(e.target.value);
              }}
              required
              maxLength={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="🍕"
            />
          </div>

          <div>
            <label
              htmlFor="split-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Name
            </label>
            <input
              id="split-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              required
              maxLength={50}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Friday Dinner"
            />
          </div>

          {serverError ? (
            <p className="text-sm text-red-400">{serverError}</p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSplitModal;
