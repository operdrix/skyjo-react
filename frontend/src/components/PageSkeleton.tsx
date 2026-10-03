// Squelette affiché pendant le chargement d'une page de partie
export default function PageSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
      <div className="flex lg:col-span-2 space-y-4 flex-col gap-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-4 w-28"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
      </div>
      <div className="flex space-y-4 flex-col gap-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-4 w-28"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
      </div>
    </div>
  );
}
