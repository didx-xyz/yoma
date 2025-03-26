# 🌐 Yoma Web

## ✨ Overview

Yoma Web is a modern, responsive frontend application built with NextJS 15 & React 19. It provides an intuitive interface for users to interact with the Yoma platform, enabling them to access opportunities, manage their profiles, and connect with organizations. The application is also available as a Progressive Web App (PWA), allowing users to install it on their devices for offline access and an app-like experience.

<p align="center">
<img src="../../docs/images/overview-web.png" width="650" />
</p>

## 🚀 Quick Start

1. Install dependencies:

   ```bash
   yarn install
   # or
   npm install
   ```

2. Start the development server:

   ```bash
   yarn dev
   # or
   npm run dev
   ```

3. 🎉 Open [http://localhost:3000](http://localhost:3000) in your browser to see the application!

## 📋 Available Scripts

| Command          | Description                                        |
| ---------------- | -------------------------------------------------- |
| `yarn dev`       | Starts the development server                      |
| `yarn build`     | Creates an optimized production build              |
| `yarn start`     | Runs the built app in production mode              |
| `yarn lint`      | Runs ESLint to catch code quality issues           |
| `yarn test`      | Executes Jest tests                                |
| `yarn analyze`   | Runs the bundle analyzer to visualize bundle sizes |
| `yarn cypress`   | Opens Cypress for end-to-end testing               |
| `yarn storybook` | Starts Storybook for component development         |

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts for state management
├── hooks/          # Custom React hooks
├── layouts/        # Page layout components
├── lib/            # Libraries and utility functions
├── pages/          # Next.js page components
├── public/         # Static assets
├── styles/         # Global styles and theme
└── types/          # TypeScript type definitions
```

## 🧪 Testing

This project uses:

- Jest for unit and integration tests
- Cypress for end-to-end testing

Run tests with:

```bash
# Unit and integration tests
yarn test

# End-to-end tests
yarn cypress
```

## 📚 Documentation

For more details on architecture, design decisions, and component guidelines, please refer to our [documentation](../../docs/README.md).
