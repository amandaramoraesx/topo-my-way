import { useApp, viewMeta } from "@/context/AppContext";

export default function PlaceholderView() {
  const { currentView } = useApp();
  const meta = viewMeta[currentView];
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-center text-muted-foreground">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-bold mb-2">{meta.title}</h2>
        <p className="text-[13px]">{meta.sub}</p>
      </div>
    </div>
  );
}
