import { requireStaff } from "@/lib/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export default async function AdminContentPage() {
  await requireStaff();
  return (
    <ComingSoon
      title="Site content"
      blurb="Edit About copy, Contact info (WhatsApp number, phone, hours, map pin), hero banner, delivery zones and fees."
      eta="Phase 5 of L-148"
    />
  );
}
