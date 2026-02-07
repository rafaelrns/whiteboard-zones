import { useEffect, useState } from 'react';

const STEPS = [
  { title: 'Bem-vindo!', body: 'Este é o Zonas Colaborativas. Você pode desenhar e colaborar por zonas.' },
  { title: 'Zonas', body: 'Use “Criar zona” para desenhar zonas com regras diferentes.' },
  { title: 'Sugestões', body: 'Ative “Sugestão” no canvas para anotar sem alterar o original.' },
  { title: 'Cmd/Ctrl + K', body: 'Abra a paleta de comandos para ações rápidas.' },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('zc:onboarding:seen');
    if (!seen) setOpen(true);
  }, []);

  function close() {
    localStorage.setItem('zc:onboarding:seen', '1');
    setOpen(false);
  }

  if (!open) return null;
  const s = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="text-base font-semibold">{s.title}</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.body}</div>

        <div className="mt-5 flex items-center justify-between">
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40"
            onClick={close}
          >
            Pular
          </button>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40"
              onClick={() => setStep((v) => Math.max(0, v - 1))}
              disabled={step === 0}
            >
              Voltar
            </button>
            <button
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-slate-50 dark:text-slate-950"
              onClick={() => (last ? close() : setStep((v) => v + 1))}
            >
              {last ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
