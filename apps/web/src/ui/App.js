import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, SOCKET_URL, SOCKET_PATH } from '../lib/api';
import { useAppStore } from './store';
import { LoginCard } from './LoginCard';
import { CanvasPage } from './canvas/CanvasPage';
import { NotificationCenter } from './notifications/NotificationCenter';
import { CommandPalette } from './command/CommandPalette';
import { OnboardingTour } from './onboarding/OnboardingTour';
import { ShareInviteModal } from './invite/ShareInviteModal';
export function App() {
    const { boardId: routeBoardId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [boardsOpen, setBoardsOpen] = useState(false);
    const [isBoardOwner, setIsBoardOwner] = useState(null);
    const [boards, setBoards] = useState([]);
    const [creatingBoard, setCreatingBoard] = useState(false);
    const [socket, setSocket] = useState(null);
    /** Abas abertas: quadros em exibição */
    const [openTabs, setOpenTabs] = useState([]);
    /** Modal para nome do novo quadro */
    const [newBoardModalOpen, setNewBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const { theme, setTheme, token, user, clearAuth, boardOnlineCount, currentBoardId, triggerNotifRefresh, triggerInviteListRefresh } = useAppStore();
    const boardIdForAccess = currentBoardId ?? routeBoardId ?? null;
    useEffect(() => {
        if (!token && routeBoardId)
            navigate('/', { replace: true });
    }, [token, routeBoardId, navigate]);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    useEffect(() => {
        if (!token) {
            socket?.disconnect();
            setSocket(null);
            return;
        }
        let s = null;
        // Pequeno atraso evita conexão/desconexão dupla do React Strict Mode em dev
        const t = setTimeout(() => {
            s = io(SOCKET_URL, { path: SOCKET_PATH, transports: ['websocket'], auth: { token } });
            s.on('connect', () => setSocket(s));
            s.on('connect_error', (err) => {
                console.warn('[Socket] connect_error:', err.message);
            });
            s.on('server:ping', () => s?.emit('client:pong'));
            s.on('notif:new', () => triggerNotifRefresh());
            s.on('invite:accepted', () => triggerInviteListRefresh());
        }, 50);
        return () => {
            clearTimeout(t);
            if (s) {
                s.disconnect();
                setSocket(null);
            }
        };
    }, [token]);
    useEffect(() => {
        const onKeyDown = (e) => {
            const k = e.key.toLowerCase();
            const meta = e.metaKey || e.ctrlKey;
            if (meta && k === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const logout = () => clearAuth();
    useEffect(() => {
        if (!token || !boardIdForAccess) {
            setIsBoardOwner(null);
            return;
        }
        api(`/boards/${boardIdForAccess}/access`, { method: 'GET' }, token)
            .then((r) => {
            setIsBoardOwner(r.isOwner);
            if (r.boardName) {
                setOpenTabs((prev) => {
                    const exists = prev.some((t) => t.id === boardIdForAccess);
                    if (exists) {
                        return prev.map((t) => (t.id === boardIdForAccess ? { ...t, name: r.boardName } : t));
                    }
                    return [...prev, { id: boardIdForAccess, name: r.boardName }];
                });
            }
        })
            .catch(() => setIsBoardOwner(null));
    }, [token, boardIdForAccess]);
    const refreshBoards = useCallback(async () => {
        if (!token)
            return;
        try {
            const list = await api(`/boards`, { method: 'GET' }, token);
            setBoards(Array.isArray(list) ? list : []);
        }
        catch {
            setBoards([]);
        }
    }, [token]);
    useEffect(() => {
        refreshBoards();
    }, [refreshBoards]);
    const addTab = useCallback((id, name) => {
        setOpenTabs((prev) => {
            if (prev.some((t) => t.id === id))
                return prev;
            return [...prev, { id, name }];
        });
    }, []);
    const removeTab = useCallback((id) => {
        setOpenTabs((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const boardIdForShare = currentBoardId ?? routeBoardId ?? null;
    const activeBoardId = routeBoardId ?? currentBoardId ?? null;
    const handleBoardLoaded = useCallback((id, name) => {
        addTab(id, name);
    }, [addTab]);
    const handleCloseTab = useCallback((e, id) => {
        e.stopPropagation();
        removeTab(id);
        if (activeBoardId === id) {
            const remaining = openTabs.filter((t) => t.id !== id);
            const next = remaining[remaining.length - 1];
            navigate(next ? `/board/${next.id}` : '/', { replace: true });
        }
    }, [activeBoardId, openTabs, removeTab, navigate]);
    function openNewBoardModal() {
        setNewBoardName('');
        setNewBoardModalOpen(true);
    }
    async function handleNewBoard(name) {
        if (!token || creatingBoard)
            return;
        const boardName = (name ?? newBoardName).trim() || 'Novo quadro';
        setCreatingBoard(true);
        setNewBoardModalOpen(false);
        try {
            const b = await api(`/boards`, {
                method: 'POST',
                body: JSON.stringify({ name: boardName }),
            }, token);
            setBoardsOpen(false);
            addTab(b.id, b.name ?? boardName);
            navigate(`/board/${b.id}`, { replace: false, state: { isNew: true } });
            await refreshBoards();
        }
        catch {
            // ignore
        }
        finally {
            setCreatingBoard(false);
        }
    }
    function handleLeaveCollaboration() {
        navigate('/', { replace: true });
    }
    if (!token || !user) {
        return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950", children: [_jsx("header", { className: "border-b border-slate-200/70 dark:border-slate-800", children: _jsx("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-8 w-8 rounded-xl bg-slate-900 dark:bg-slate-50" }), _jsxs("div", { className: "leading-tight", children: [_jsx("div", { className: "text-sm font-semibold", children: "Zonas Colaborativas" }), _jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Quadro branco com colabora\u00E7\u00E3o por zonas" })] })] }) }) }), _jsx("main", { className: "mx-auto max-w-md px-4 py-12", children: _jsx(LoginCard, {}) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950", children: [_jsx("header", { className: "relative z-40 border-b border-slate-200/70 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95", children: _jsxs("div", { className: "mx-auto flex max-w-full items-center justify-between px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-8 w-8 rounded-xl bg-slate-900 dark:bg-slate-50" }), _jsxs("div", { className: "leading-tight", children: [_jsx("div", { className: "text-sm font-semibold", children: "Zonas Colaborativas" }), _jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: boardOnlineCount != null ? `${boardOnlineCount} online` : socket ? 'Conectado' : 'Conectando…' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => {
                                                setBoardsOpen((o) => !o);
                                                if (!boardsOpen)
                                                    refreshBoards();
                                            }, className: "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200", title: "Meus quadros", children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCCB" }), " Quadros"] }), boardsOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setBoardsOpen(false), "aria-hidden": true }), _jsxs("div", { className: "absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800", children: [_jsxs("button", { type: "button", onClick: openNewBoardModal, disabled: creatingBoard, className: "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 disabled:opacity-50", children: [_jsx("span", { "aria-hidden": true, children: "\u2795" }), " Novo Quadro"] }), _jsx("div", { className: "border-t border-slate-200 dark:border-slate-700" }), boards.length === 0 ? (_jsx("div", { className: "px-4 py-3 text-xs text-slate-500 dark:text-slate-400", children: "Nenhum quadro criado" })) : (boards.map((b) => (_jsx("button", { type: "button", onClick: () => {
                                                                setBoardsOpen(false);
                                                                addTab(b.id, b.name);
                                                                navigate(`/board/${b.id}`);
                                                            }, className: `block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${(currentBoardId ?? routeBoardId) === b.id ? 'bg-slate-100 font-medium dark:bg-slate-700' : ''}`, children: b.name }, b.id))))] })] }))] }), isBoardOwner !== false && (_jsxs("button", { type: "button", onClick: () => boardIdForShare && setShareOpen(true), disabled: !boardIdForShare, className: "flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50 disabled:dark:opacity-50", title: !boardIdForShare ? 'Aguardando carregar quadro…' : 'Convidar colaboradores', children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDC65" }), " Compartilhar / Convidar"] })), isBoardOwner === false && (_jsxs("button", { type: "button", onClick: handleLeaveCollaboration, className: "flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50", title: "Sair da colabora\u00E7\u00E3o deste quadro", children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDEAA" }), " Sair da colabora\u00E7\u00E3o"] })), _jsx(NotificationCenter, {}), _jsx("button", { type: "button", onClick: toggleTheme, className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700", "aria-label": theme === 'dark' ? 'Tema claro' : 'Tema escuro', children: theme === 'dark' ? '☀️' : '🌙' }), _jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-200", children: user.name }), boardOnlineCount != null && (_jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["\u2022 ", boardOnlineCount, " online"] }))] }), _jsx("button", { type: "button", onClick: logout, className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700", children: "Sair" })] })] }) }), _jsx("div", { className: "border-b border-slate-200 bg-slate-100/80 px-4 py-1 dark:border-slate-800 dark:bg-slate-900/50", children: _jsxs("div", { className: "flex items-center gap-1 overflow-x-auto", children: [openTabs.map((tab) => (_jsxs("button", { type: "button", onClick: () => navigate(`/board/${tab.id}`), className: `group flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition ${activeBoardId === tab.id
                                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100'
                                : 'text-slate-600 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-700/80'}`, children: [_jsx("span", { className: "max-w-[140px] truncate", children: tab.name }), openTabs.length > 1 && (_jsx("span", { role: "button", tabIndex: 0, onClick: (e) => handleCloseTab(e, tab.id), onKeyDown: (e) => e.key === 'Enter' && handleCloseTab(e, tab.id), className: "rounded p-0.5 opacity-60 hover:bg-slate-300 hover:opacity-100 dark:hover:bg-slate-600", "aria-label": `Fechar ${tab.name}`, children: "\u00D7" }))] }, tab.id))), _jsxs("button", { type: "button", onClick: openNewBoardModal, disabled: creatingBoard, className: "flex shrink-0 items-center gap-1 rounded-t-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-slate-300 disabled:opacity-50", title: "Novo Quadro", children: [_jsx("span", { children: "+" }), " Novo Quadro"] })] }) }), _jsx("main", { className: "w-full py-4", children: _jsx(CanvasPage, { initialBoardId: routeBoardId, onBoardLoaded: handleBoardLoaded, isNewBoard: !!location.state?.isNew }) }), boardIdForShare && (_jsx(ShareInviteModal, { boardId: boardIdForShare, open: shareOpen, onClose: () => setShareOpen(false) })), newBoardModalOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40", onClick: () => setNewBoardModalOpen(false), children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Novo Quadro" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "D\u00EA um nome para o quadro. Ser\u00E1 criado em branco." }), _jsx("input", { type: "text", placeholder: "Nome do quadro", className: "mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", value: newBoardName, onChange: (e) => setNewBoardName(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleNewBoard(), autoFocus: true }), _jsxs("div", { className: "mt-4 flex gap-2 justify-end", children: [_jsx("button", { type: "button", className: "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800", onClick: () => setNewBoardModalOpen(false), children: "Cancelar" }), _jsx("button", { type: "button", className: "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600", onClick: () => handleNewBoard(), children: "Criar" })] })] }) })), _jsx(CommandPalette, { open: paletteOpen, onClose: () => setPaletteOpen(false), commands: [
                    { id: 'new-board', title: 'Novo Quadro', keywords: 'novo quadro criar board', action: openNewBoardModal },
                    { id: 'share', title: 'Compartilhar / Convidar colaboradores', keywords: 'compartilhar convidar share invite', action: () => boardIdForShare && setShareOpen(true) },
                    ...(isBoardOwner === false
                        ? [{ id: 'leave-collab', title: 'Sair da colaboração', keywords: 'sair colaboração leave', action: handleLeaveCollaboration }]
                        : []),
                    { id: 'toggle-theme', title: 'Alternar tema (dark/light)', keywords: 'theme dark light', action: toggleTheme },
                    { id: 'logout', title: 'Sair', keywords: 'logout sair', action: logout },
                ] }), _jsx(OnboardingTour, {})] }));
}
