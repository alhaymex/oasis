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
