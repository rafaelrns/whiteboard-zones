import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
export function CommandPalette({ open, onClose, commands, }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    useEffect(() => {
        if (!open) {
            setQuery('');
            setSelected(null);
        }
    }, [open]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return commands;
        return commands.filter((c) => {
            const hay = (c.title + ' ' + (c.keywords ?? '')).toLowerCase();
            return hay.includes(q);
        });
    }, [commands, query]);
    return (_jsx(Transition.Root, { show: open, as: Fragment, children: _jsxs(Dialog, { as: "div", className: "relative z-50", onClose: onClose, children: [_jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-150", enterFrom: "opacity-0", enterTo: "opacity-100", leave: "ease-in duration-100", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: _jsx("div", { className: "fixed inset-0 bg-black/40" }) }), _jsx("div", { className: "fixed inset-0 overflow-y-auto p-4 sm:p-8", children: _jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-150", enterFrom: "opacity-0 translate-y-2 scale-[0.98]", enterTo: "opacity-100 translate-y-0 scale-100", leave: "ease-in duration-100", leaveFrom: "opacity-100 translate-y-0 scale-100", leaveTo: "opacity-0 translate-y-2 scale-[0.98]", children: _jsxs(Dialog.Panel, { className: "mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950", children: [_jsxs("div", { className: "border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800", children: ["Comandos", _jsx("span", { className: "ml-2 text-xs font-normal text-slate-500 dark:text-slate-400", children: "Cmd/Ctrl + K" })] }), _jsxs(Combobox, { value: selected, onChange: (c) => {
                                        setSelected(c);
                                        c?.action();
                                        onClose();
                                    }, children: [_jsx("div", { className: "p-3", children: _jsx(Combobox.Input, { className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100", placeholder: "Digite um comando\u2026", onChange: (e) => setQuery(e.target.value), autoFocus: true }) }), _jsx("div", { className: "max-h-80 overflow-auto p-2 pt-0", children: filtered.length === 0 ? (_jsx("div", { className: "p-3 text-xs text-slate-500 dark:text-slate-400", children: "Nenhum comando encontrado." })) : (filtered.map((c) => (_jsx(Combobox.Option, { value: c, className: ({ active }) => `cursor-pointer rounded-xl px-3 py-2 text-sm ${active
                                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50'
                                                    : 'text-slate-700 dark:text-slate-200'}`, children: c.title }, c.id)))) })] }), _jsx("div", { className: "border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400", children: "Dica: voc\u00EA pode adicionar atalhos e comandos customizados nas pr\u00F3ximas etapas." })] }) }) })] }) }));
}
