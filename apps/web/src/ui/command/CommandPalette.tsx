import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';

type Cmd = {
  id: string;
  title: string;
  keywords?: string;
  action: () => void;
};

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Cmd[];
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Cmd | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelected(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = (c.title + ' ' + (c.keywords ?? '')).toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-8">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 translate-y-2 scale-[0.98]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-[0.98]"
          >
            <Dialog.Panel className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">
                Comandos
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">Cmd/Ctrl + K</span>
              </div>

              <Combobox
                value={selected}
                onChange={(c) => {
                  setSelected(c);
                  c?.action();
                  onClose();
                }}
              >
                <div className="p-3">
                  <Combobox.Input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Digite um comando…"
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="max-h-80 overflow-auto p-2 pt-0">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400">Nenhum comando encontrado.</div>
                  ) : (
                    filtered.map((c) => (
                      <Combobox.Option
                        key={c.id}
                        value={c}
                        className={({ active }) =>
                          `cursor-pointer rounded-xl px-3 py-2 text-sm ${
                            active
                              ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50'
                              : 'text-slate-700 dark:text-slate-200'
                          }`
                        }
                      >
                        {c.title}
                      </Combobox.Option>
                    ))
                  )}
                </div>
              </Combobox>

              <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Dica: você pode adicionar atalhos e comandos customizados nas próximas etapas.
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
