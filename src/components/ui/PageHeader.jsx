import { cn } from '../../lib/utils';

export default function PageHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 lg:mb-8', className)}>
      <div>
        <h2 className="text-2xl lg:text-3xl font-display font-semibold text-text tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1 font-sans">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
