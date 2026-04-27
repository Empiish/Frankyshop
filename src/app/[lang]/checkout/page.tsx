import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCurrentCustomer } from "@/lib/customer-auth";

type Zone = {
  id: string;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
  fee_tsh: number;
};

export default async function CheckoutPage({ params }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  const zones = await sql<Zone[]>`
    select id, name_en, name_sw, name_hi, fee_tsh
    from delivery_zones
    where is_active = true
    order by sort_order asc
  `;

  const localizedZones = zones.map((z) => ({
    id: z.id,
    name:
      (lang === "sw" && z.name_sw) ||
      (lang === "hi" && z.name_hi) ||
      z.name_en,
    fee_tsh: z.fee_tsh,
  }));

  const customer = await getCurrentCustomer();
  let prefill: { name: string; phone: string; email: string } | undefined;
  if (customer) {
    const rows = await sql<{ full_name: string | null; phone: string | null; email: string | null }[]>`
      select full_name, phone, email from customers where id = ${customer.customerId} limit 1
    `;
    const c = rows[0];
    if (c) prefill = {
      name: c.full_name ?? customer.fullName ?? "",
      phone: c.phone ?? "",
      email: c.email ?? customer.email ?? "",
    };
  }

  return <CheckoutForm lang={lang as Locale} dict={dict} zones={localizedZones} prefill={prefill} />;
}
