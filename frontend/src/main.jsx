/**
 * main.jsx — Application Entry Point
 *
 * This is the first JavaScript file executed by the browser (referenced by
 * index.html via <script type="module" src="/src/main.jsx">).
 *
 * It mounts the React application into the <div id="root"> element defined
 * in index.html using React 18's createRoot API.
 *
 * StrictMode:
 *   React.StrictMode wraps the app during development only (it has no effect
 *   in production builds). It helps catch common mistakes by:
 *     - Rendering components twice to detect side-effect bugs
 *     - Warning about deprecated lifecycle methods
 *     - Detecting unexpected state mutations
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Global stylesheet — imported here so it applies to the entire app
import './styles.css';

// Root application component
import App from './App.jsx';

// Find the <div id="root"> element in index.html and mount the React app into it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* App is the top-level component; all other components are rendered inside it */}
    <App />
  </StrictMode>
);
