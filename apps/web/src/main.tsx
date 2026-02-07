import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './ui/App';
import { InviteAcceptPage } from './ui/invite/InviteAcceptPage';
import './ui/canvas/ArrowLine'; // registra ArrowLine no Fabric para serialização
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/invite/accept" element={<InviteAcceptPage />} />
        <Route path="/board/:boardId" element={<App />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
