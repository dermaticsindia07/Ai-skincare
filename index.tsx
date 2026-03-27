import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StartPage from './components/StartPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

function getRootComponent() {
  const path = window.location.pathname.toLowerCase();
  if (path === '/start' || path.startsWith('/start/')) {
    return <StartPage />;
  }
  return <App />;
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {getRootComponent()}
  </React.StrictMode>
);
