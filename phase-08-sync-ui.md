# Phase 8: Add Sync UI (Status Indicators, Conflict Notifications)

## Goal

Add user-visible sync status indicators so users know when they have unsynced changes, when sync is in progress, and when conflicts occurred. This completes the user-facing offline experience.

## Prerequisites

- Phase 7 complete (sync works end-to-end)

## Steps

### 1. Create a sync status context (`frontend/src/sync/SyncStatusProvider.tsx`)

Provides sync state to the whole app:

```typescript
interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;      // Total unsynced operations across all splits
  lastSyncTime: Date | null;
  lastSyncErrors: string[];
}

const SyncStatusContext = createContext<SyncStatus>({
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastSyncErrors: [],
});

export const SyncStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Query the operations table for unsynced count
  // Track sync mutations in progress
  // Store last sync time in state (or SQLite)
  // ...
};

export const useSyncStatus = () => useContext(SyncStatusContext);
```

### 2. Add a sync indicator to the AppBar

In screens that show an AppBar (Home, SplitDetail), add a sync status icon:

- **Cloud with checkmark** — all synced, no pending operations
- **Cloud with arrow** — sync in progress (spinning/animated)
- **Cloud with exclamation** — has unsynced changes (pending operations > 0)
- **Cloud with X** — offline (no network connectivity, detected via `@react-native-community/netinfo`)

Use `react-native-paper`'s `IconButton` in the Appbar:

```tsx
<Appbar.Action
  icon={getSyncIcon(syncStatus)}
  onPress={() => syncAll()}
  color={getSyncColor(syncStatus)}
/>
```

### 3. Add pending badge to split items in the Home list

When a split has pending (unsynced) operations, show a small badge:

```tsx
// In the split list item:
{pendingCount > 0 && (
  <Badge size={20}>{pendingCount}</Badge>
)}
```

### 4. Show conflict notifications via snackbar

When sync resolves conflicts, inform the user through the existing snackbar system:

```typescript
// In the sync hook, after sync completes:
onSuccess: (result) => {
  if (result.errors.length > 0) {
    showSnackbar({
      message: `Sync completed with ${result.errors.length} issue(s)`,
      type: "error",
    });
  } else if (result.pulled > 0) {
    showSnackbar({
      message: `Synced: ${result.pulled} update(s) from others`,
      type: "info",
    });
  }
};
```

Specific conflict messages:
- "An expense you edited was deleted by another user"
- "An expense was updated by another user — their changes were applied"
- "A split you modified was updated by another user"

### 5. Install network detection

```bash
npx expo install @react-native-community/netinfo
```

Create a hook:

```typescript
// frontend/src/hooks/useNetworkStatus.ts
import NetInfo from "@react-native-community/netinfo";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
};
```

Integrate with sync:
- Disable the sync button when offline (grey it out)
- Show "Offline" indicator in the AppBar when disconnected

### 6. Add "last synced" timestamp

Show when the split was last synced, e.g., "Last synced: 2 min ago" at the bottom of the split detail screen or in the AppBar subtitle.

Store last sync timestamp in the `sync_state` table (add a `last_synced_at` column).

## Files Created

- `frontend/src/sync/SyncStatusProvider.tsx`
- `frontend/src/hooks/useNetworkStatus.ts`

## Files Modified

- `frontend/src/screens/HomeScreen.tsx` — add sync icon to AppBar, pending badges on splits
- `frontend/src/screens/split-detail/SplitDetailScreen.tsx` — add sync icon, last synced time
- `frontend/src/hooks/useSync.ts` — add snackbar notifications for conflicts
- `frontend/src/db/schema.ts` — add `lastSyncedAt` to `syncState` table (optional)
- `frontend/src/db/migrate.ts` — add migration for new column (optional)
- `frontend/App.tsx` — add `SyncStatusProvider` to provider tree

## Verification

1. **Offline indicator**: Turn on airplane mode → sync icon shows offline state → turn off → icon updates
2. **Pending badge**: Create a split offline → pending count badge appears → sync → badge disappears
3. **Sync icon animation**: Trigger sync → icon shows syncing state → completes → shows synced state
4. **Conflict snackbar**: Set up a conflict scenario (two users edit same expense) → sync → snackbar shows conflict message
5. **Last synced**: Sync a split → "Last synced: just now" appears → wait → timestamp updates
6. `cd frontend && npm run typecheck` passes

## Key Design Decisions

- **Minimal UI** — don't overwhelm the user with sync details. A single icon + badge covers most needs.
- **Snackbar for conflicts** — not a modal. Conflicts are resolved automatically (last-writer-wins), so the user just needs to know it happened.
- **Network detection is informational only** — we don't prevent the user from trying to sync when offline (the request will just fail). We just grey out the icon as a hint.
