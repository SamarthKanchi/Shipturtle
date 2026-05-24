import { Zap } from 'lucide-react';

export default function Logo({ size = 'default' }) {
  const sizes = {
    small: { icon: 18, text: 'text-base' },
    default: { icon: 22, text: 'text-xl' },
    large: { icon: 28, text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.default;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20">
        <Zap size={s.icon} className="text-white" strokeWidth={2.5} />
      </div>
      <span className={`${s.text} font-bold tracking-tight text-zinc-50`}>
        Sync<span className="gradient-brand-text">Flow</span>
      </span>
    </div>
  );
}
