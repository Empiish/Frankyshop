import { requireStaff } from "@/lib/auth";
import { getAll } from "@/lib/site-content";
import { SiteContentForm } from "@/components/admin/SiteContentForm";

export default async function AdminContentPage() {
  await requireStaff();
  const all = await getAll();
  const v = (k: string, lang: "en" | "sw" | "hi" = "en") =>
    (all[k]?.[`value_${lang}` as const] as string | null | undefined) ?? "";

  return (
    <div>
      <p className="eyebrow">Site content</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Contact & shop info</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        These values appear in the storefront footer, contact page, and order WhatsApp links.
        Saving here updates the site immediately for everyone.
      </p>

      <div className="mt-8">
        <SiteContentForm
          defaults={{
            whatsapp_number: v("whatsapp_number"),
            shop_phone: v("shop_phone"),
            shop_lat: v("shop_lat"),
            shop_lng: v("shop_lng"),
            shop_address_en: v("shop_address", "en"),
            shop_address_sw: v("shop_address", "sw"),
            shop_address_hi: v("shop_address", "hi"),
            shop_hours_en: v("shop_hours", "en"),
            shop_hours_sw: v("shop_hours", "sw"),
            shop_hours_hi: v("shop_hours", "hi"),
          }}
        />
      </div>
    </div>
  );
}
