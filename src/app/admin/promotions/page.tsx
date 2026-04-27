import { requireStaff } from "@/lib/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export default async function AdminPromotionsPage() {
  await requireStaff();
  return (
    <ComingSoon
      title="Promotions"
      blurb="Schedule % off, fixed off, or BOGO offers across categories or specific items, with start and end dates."
      eta="Phase 4 of L-148"
    />
  );
}
