export function StatCard({ title, value, subtitle, icon, trend, color = 'action', targetValue, currentValue, targetLabel }) {
  const colors = {
    primary: 'bg-[#EAF2FC] text-[#123B73] dark:bg-[#123B73]/20 dark:text-[#EAF2FC]',
    action: 'bg-[#EAF2FC] text-[#175CD3] dark:bg-[#175CD3]/20 dark:text-[#93C5FD]',
    success: 'bg-[#ECFDF3] text-[#067647] dark:bg-[#067647]/20 dark:text-[#75E0A7]',
    warning: 'bg-[#FFFAEB] text-[#B54708] dark:bg-[#B54708]/20 dark:text-[#FEC84B]',
    danger: 'bg-[#FEF3F2] text-[#B42318] dark:bg-[#B42318]/20 dark:text-[#FDA29B]',
    blue: 'bg-[#EAF2FC] text-[#175CD3] dark:bg-[#175CD3]/20 dark:text-[#93C5FD]',
    teal: 'bg-[#EAF2FC] text-[#123B73] dark:bg-[#123B73]/20 dark:text-[#EAF2FC]',
    emerald: 'bg-[#ECFDF3] text-[#067647] dark:bg-[#067647]/20 dark:text-[#75E0A7]',
    rose: 'bg-[#FEF3F2] text-[#B42318] dark:bg-[#B42318]/20 dark:text-[#FDA29B]',
    amber: 'bg-[#FFFAEB] text-[#B54708] dark:bg-[#B54708]/20 dark:text-[#FEC84B]',
  }

  const bgColors = {
    primary: 'bg-[#123B73]',
    action: 'bg-[#175CD3]',
    success: 'bg-[#067647]',
    warning: 'bg-[#B54708]',
    danger: 'bg-[#B42318]',
    blue: 'bg-[#175CD3]',
    teal: 'bg-[#123B73]',
    emerald: 'bg-[#067647]',
    rose: 'bg-[#B42318]',
    amber: 'bg-[#B54708]',
  }

  const progressPct = (targetValue && currentValue !== undefined && targetValue > 0)
    ? Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
    : 0;

  return (
    <div className="app-panel-shell p-6">
      <div className="flex items-center gap-4">
        <div className={`app-panel-icon w-12 h-12 flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</div>
        </div>
      </div>
      
      {targetValue !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {progressPct.toFixed(1)}% Tercapai
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {targetLabel || `Target: ${targetValue}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${bgColors[color]}`} 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {(subtitle || trend) && !targetValue && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend && (
            <span className={`font-medium ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
        </div>
      )}
    </div>
  )
}
