export default function NewExpenseLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <div className="h-7 w-36 rounded-lg bg-muted animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
