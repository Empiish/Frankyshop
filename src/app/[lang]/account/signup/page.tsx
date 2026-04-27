import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CustomerSignUpForm } from "@/components/CustomerSignUpForm";

export default async function CustomerSignUpPage({
  params,
}: PageProps<"/[lang]/account/signup">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const session = await getCurrentCustomer();
  if (session) redirect(`/${lang}/account`);
  const dict = await getDictionary(lang as Locale);
  return (
    <section className="mx-auto grid max-w-md px-6 py-20">
      <CustomerSignUpForm lang={lang as Locale} dict={dict} />
    </section>
  );
}
