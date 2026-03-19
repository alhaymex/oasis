# Contributing to Oasis

Thank you for your interest in contributing to Oasis! We welcome contributions from the community to help make this desktop app even better.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with a clear description of the problem and steps to reproduce it.

### Suggesting Features

If you have an idea for a new feature, please open an issue to discuss it.

### Pull Requests

1. Fork the repository.
2. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

## Local Development Setup

Oasis is built with **Electrobun**, **React**, **Bun**, and **Turbo**.

### Prerequisites

- [Bun](https://bun.sh/) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alhaymex/oasis.git
   cd oasis
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

### Running the App

To start the development server with Hot Module Replacement (HMR):

```bash
bun run dev:hmr
```

### Catalog and Packaging

The desktop app no longer fetches its catalog at runtime on first launch.

- `catalog/catalog.json` is the canonical source in the repo.
- `apps/desktop/scripts/stage-catalog.ts` copies that file to `apps/desktop/.generated/catalog/catalog.json` before desktop dev/build runs.
- Electrobun packages the staged catalog and `apps/desktop/drizzle` into app resources.
- The installed app must not rely on files outside `apps/desktop`. If a packaged feature needs a runtime file, bundle it first.

Useful desktop commands:

```bash
bun run --cwd apps/desktop stage:catalog
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop build:canary
```

Packaged startup behavior:

- Run DB migrations from bundled `drizzle/`
- Seed/update SQLite from bundled `catalog/catalog.json`
- Skip reseed when the bundled catalog hash is unchanged
- Abort startup if migration or seeding fails

### Building the App

To build the desktop application:

```bash
bun run build:canary
```

## Code Style

- We use **Prettier** for code formatting. You can run `bun run format` to format the codebase.
- We use **ESLint** for linting.

## License

By contributing to Oasis, you agree that your contributions will be licensed under the project's license.
