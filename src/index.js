import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('ddh-app-root') || document.getElementById('root');
const pageId = rootElement?.getAttribute('data-page-id') || 
               (process.env.NODE_ENV === 'development' ? '21957' : null);

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App pageId={pageId} />
    </BrowserRouter>
    <div>
      <h1>Hello World!</h1>
    </div>
  </React.StrictMode>
);
