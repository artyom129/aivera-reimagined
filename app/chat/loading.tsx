export default function ChatLoading() {
  return (
    <div className="flex h-dvh bg-background" aria-busy="true" aria-label="Загружаем чаты">
      <div className="hidden w-72 shrink-0 space-y-3 border-r bg-sidebar p-3 lg:block">
        <div className="h-6 w-24 rounded bg-sidebar-accent" />
        <div className="h-9 rounded-md bg-sidebar-accent" />
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-6 rounded bg-sidebar-accent/70" style={{ width: `${90 - index * 6}%` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="h-14 border-b" />
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-3 p-8">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
