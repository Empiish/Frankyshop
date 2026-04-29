import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  return { title: "Terms & Conditions — FrankyShop" };
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-24">
      <p className="eyebrow">Legal</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: April 2026 · FrankyShop, Kariakoo, Dar es Salaam, Tanzania
      </p>

      <div className="prose prose-sm mt-12 max-w-none [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-muted-foreground [&_ul]:leading-relaxed [&_ul]:mb-4 [&_li]:mb-1">

        <h2>1. About Us</h2>
        <p>
          FrankyShop is a retail business operating from Kariakoo, Dar es Salaam, Tanzania.
          We sell cleaning and household tools online and in-store. By placing an order
          through this website you agree to the terms set out below.
        </p>

        <h2>2. Orders &amp; Pricing</h2>
        <p>
          All prices are displayed in Tanzanian Shillings (TSh) and are inclusive of any
          applicable VAT. Prices may change at any time without notice; the price charged
          will be the one shown at the time you place your order.
        </p>
        <p>
          We reserve the right to cancel or refuse any order at our discretion, for example
          if a product is out of stock or if there is an error in the listed price. You will
          be notified by WhatsApp and any payment already made will be fully refunded.
        </p>

        <h2>3. Payment</h2>
        <p>
          We currently accept payment via M-Pesa Tanzania. Payment must be completed before
          your order is dispatched. You will receive an M-Pesa push notification on your phone;
          please confirm the transaction within 5 minutes or the request will expire.
        </p>
        <p>
          We do not store card numbers or M-Pesa PINs. Payment processing is handled securely
          by the respective payment networks.
        </p>

        <h2>4. Delivery</h2>
        <p>
          We deliver within Dar es Salaam only. Delivery fees vary by zone and are shown at
          checkout before you confirm your order. Estimated delivery time is 1–3 business days
          after payment is confirmed. We will contact you via WhatsApp to confirm a delivery
          window.
        </p>
        <p>
          Risk of loss and title for products passes to you upon delivery. We are not responsible
          for delays caused by incorrect or incomplete delivery addresses.
        </p>

        <h2>5. Returns &amp; Refunds</h2>
        <p>
          If a product arrives damaged or is not what you ordered, contact us via WhatsApp within
          48 hours of delivery with a photo of the item. We will arrange a replacement or full
          refund at our discretion.
        </p>
        <p>
          We do not accept returns of products that have been used, unless they are defective.
          Change-of-mind returns are at our discretion.
        </p>

        <h2>6. Product Information</h2>
        <p>
          We make reasonable efforts to display product photos and descriptions accurately.
          Colours may appear slightly different on your screen. Product specifications
          (size, material) are provided by the manufacturer and may vary.
        </p>

        <h2>7. Privacy &amp; Data</h2>
        <p>
          When you place an order we collect your name, phone number, email address (optional),
          and delivery address. This information is used solely to process and deliver your order
          and to contact you about it. We do not sell your personal data to third parties.
        </p>
        <p>
          We may contact you via WhatsApp about your order status. If you create an account,
          your order history is stored so you can access it at any time.
        </p>

        <h2>8. Intellectual Property</h2>
        <p>
          All content on this website — including text, images, and design — is owned by
          FrankyShop or its licensors. You may not reproduce or redistribute any content
          without our prior written consent.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the extent permitted by Tanzanian law, FrankyShop is not liable for indirect,
          incidental, or consequential losses arising from your use of this website or any
          products purchased. Our total liability for any claim shall not exceed the amount
          you paid for the order in question.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These terms are governed by the laws of the United Republic of Tanzania. Any
          disputes shall be subject to the exclusive jurisdiction of the courts of Tanzania.
        </p>

        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. The current version will always be
          available on this page. Continued use of the site after changes are posted
          constitutes acceptance of the new terms.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms? Reach us on WhatsApp at{" "}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "255000000000"}`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            +{process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "255 000 000 000"}
          </a>{" "}
          or visit us at Kariakoo, Dar es Salaam.
        </p>
      </div>
    </article>
  );
}
