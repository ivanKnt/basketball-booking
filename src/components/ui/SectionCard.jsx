import { cn } from '../../lib/utils';

export default function SectionCard({ icon: Icon, iconClassName, title, children, className, delay }) {
  return (
    <div
      className={cn('apple-card p-5 lg:p-6 space-y-5', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-border pb-3">
          {Icon && <Icon className={cn('shrink-0', iconClassName || 'text-primary')} size={18} />}
          <h3 className="font-display font-medium text-base lg:text-lg text-text tracking-wide">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
