import { registerRootComponent } from 'expo';
import App from './App';
import { initDatabase } from './src/database';

// Initialize SQLite schema before the app mounts.
initDatabase().catch(() => {
  // Failing silently here to avoid blocking the app;
  // consider reporting this to an error tracking service in production.
});

registerRootComponent(App);
