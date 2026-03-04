import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

function App({ pageId }) {
  return (
    <Routes>
      {pageId === '21957' && (
        <>
          <Route path="/nhl-live-tracker/dashboard" element={<div>Dashboard</div>} />
          <Route path="/nhl-live-tracker/live" element={<div>Live</div>} />
          <Route path="*" element={<Navigate to="/nhl-live-tracker/dashboard" />} />
        </>
      )}
    </Routes>
  );
}

export default App;