import type { Metadata } from "next";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getUserContext } from "@/lib/queries";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const ctx = await getUserContext();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <OnboardingForm initialName={ctx.profile?.display_name ?? ""} />
    </main>
  );
}
