import Link from "next/link";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY fehlt.");
  }

  return new Stripe(secretKey);
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const belongsToUser = session.metadata?.userId === user.id;
  const isPaid = session.payment_status === "paid";
  const subscription = session.subscription;
  const subscriptionStatus = typeof subscription === "string" ? null : subscription?.status;
  const isActiveSubscription = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  if (!belongsToUser || !isPaid || !isActiveSubscription) {
    return (
      <main className="min-h-screen bg-[#08090d] px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8">
          <h1 className="text-3xl font-semibold">Zahlung konnte nicht bestätigt werden.</h1>
          <p className="mt-4 leading-7 text-amber-100">
            Die Checkout-Session wurde nicht als aktive Zahlung erkannt. Bitte gehe zurück zum Dashboard und versuche es erneut.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-zinc-950">
            Zurück zum Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;

  await supabase.from("profiles").upsert({
    id: user.id,
    plan: "pro",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  });

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-200">Askfolio Pro</p>
        <h1 className="mt-4 text-4xl font-semibold">Upgrade erfolgreich.</h1>
        <p className="mt-4 leading-7 text-zinc-200">
          Dein Account wurde auf Pro gesetzt. Die Free-Limits sind jetzt aufgehoben.
        </p>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-zinc-950">
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  );
}
