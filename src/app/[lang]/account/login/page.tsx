import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CustomerLoginForm } from "@/components/CustomerLoginForm";

export default async function CustomerLoginPage({
  params,
  searchParams,
}: PageProps<"/[lang]/account/login">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const sp = (await searchParams) as { next?: string };
  const session = await getCurrentCustomer();
  if (session) redirect(sp.next?.startsWith("/") ? sp.next : `/${lang}/account`);
  const dict = await getDictionary(lang as Locale);
  return (
    <section className="mx-auto grid max-w-md px-6 py-20">
      <CustomerLoginForm lang={lang as Locale} dict={dict} next={sp.next} />
    </section>
  );
}
