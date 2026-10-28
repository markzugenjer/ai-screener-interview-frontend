import { getI18n } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getI18n();
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label={t.common.loading}>
      <span className="size-8 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
    </div>
  );
}
