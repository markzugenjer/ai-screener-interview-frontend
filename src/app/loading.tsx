export default function Loading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
    </div>
  );
}
