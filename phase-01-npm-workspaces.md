# Phase 1: Set Up npm Workspaces + Create @splitters/domain Package

## Goal

Convert the project into an npm workspaces monorepo and create the `@splitters/domain` shared package with a working build that can be imported by both frontend and backend.

## Prerequisites

- None — this is the first phase

## Steps

### 1. Create root `package.json`

Create `/package.json` at the project root:

```json
{
  "name": "splitters",
  "private": true,
  "workspaces": [
    "packages/*",
    "frontend",
    "backend"
  ]
}
```

### 2. Create the domain package directory structure

```
packages/domain/
├── src/
│   ├── clock/
│   ├── operations/
│   ├── reducers/
│   ├── state/
│   └── validation/
├── package.json
└── tsconfig.json
```

No barrel `index.ts` — consumers import directly from the specific module path (e.g., `import { createHLC } from "@splitters/domain/src/clock/hlc"`).

### 3. Create `packages/domain/package.json`

```json
{
  "name": "@splitters/domain",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "~5.7.3"
  }
}
```

**Note**: We export raw TypeScript (`"main": "./src/index.ts"`) — no build step needed. Both Metro (frontend) and NestJS (backend with ts-node/swc) can consume TypeScript directly.

If NestJS `nest build` can't resolve raw TS from the workspace, we'll add a `tsup` build step. But try without first — simpler.

### 4. Create `packages/domain/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### 5. Add `@splitters/domain` as a dependency in frontend and backend

**`frontend/package.json`** — add to dependencies:
```json
"@splitters/domain": "*"
```

**`backend/package.json`** — add to dependencies:
```json
"@splitters/domain": "*"
```

### 6. Install dependencies from root

```bash
cd /home/lee/Documents/splitters
npm install
```

This will link the workspace packages.

### 7. Update backend to resolve the workspace package

The backend uses `module: "nodenext"` and `moduleResolution: "nodenext"` in its tsconfig. It should be able to resolve `@splitters/domain` via the workspace link.

If `nest build` fails to compile the package (because it's raw TypeScript), add a build step:

**Fallback — add `tsup` build to domain package:**
```bash
cd packages/domain && npm install -D tsup
```

Update `packages/domain/package.json`:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "typecheck": "tsc --noEmit"
  }
}
```

**Try raw TS first.** Only fall back to tsup if the NestJS build fails.

### 8. Update Metro config for frontend

Metro (Expo's bundler) needs to know about the workspace package. Check if `frontend/metro.config.js` exists. If not, create one:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
```

This tells Metro to resolve packages from both the frontend's `node_modules` and the root workspace `node_modules`.

### 9. Install `zod` in the domain package

```bash
cd packages/domain && npm install zod
```

Or from root: `npm install -w @splitters/domain zod`

## Verification

1. `npm install` from root completes without errors
2. `cd backend && npm run typecheck` passes
3. `cd frontend && npm run typecheck` passes
4. Both frontend and backend can `import {} from '@splitters/domain'` without errors
5. Frontend dev server starts (`cd frontend && npm run android` or `npm run ios`)
6. Backend dev server starts (`cd backend && npm run start:dev`)

## Files Created

- `/package.json` (new — root workspace config)
- `/packages/domain/package.json` (new)
- `/packages/domain/tsconfig.json` (new)
## Files Modified

- `/frontend/package.json` — add `@splitters/domain` dependency
- `/backend/package.json` — add `@splitters/domain` dependency
- `/frontend/metro.config.js` — create or update for workspace resolution

## Potential Issues

- **Metro symlink resolution**: Expo/Metro historically has issues with symlinks from npm workspaces. The `watchFolders` + `nodeModulesPaths` config should fix this, but may need additional tweaks.
- **NestJS build**: `nest build` uses `tsc` under the hood and may not handle raw TS imports from workspace packages. If so, add `tsup` build step as described above.
- **Hoisted dependencies**: npm workspaces hoists deps to the root. This is usually fine but can cause issues if frontend and backend need different versions of the same package. Not expected for this project.
