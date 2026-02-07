import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './ui/App';
import { InviteAcceptPage } from './ui/invite/InviteAcceptPage';
import './ui/canvas/ArrowLine'; // registra ArrowLine no Fabric para serialização
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/invite/accept", element: _jsx(InviteAcceptPage, {}) }), _jsx(Route, { path: "/board/:boardId", element: _jsx(App, {}) }), _jsx(Route, { path: "/", element: _jsx(App, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
