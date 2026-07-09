"use server";

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

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL fehlt.");
  }

  return appUrl.replace(/\/$/, "");
}

async function getOrCreateStripeCustomer(stripe: Stripe, user: { id: string; email?: string | null }) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id as string;
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      userId: user.id,
    },
  });

  await supabase.from("profiles").upsert({
    id: user.id,
    stripe_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  });

  return customer.id;
}

export async function createCheckoutSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID fehlt.");
  }

  const appUrl = getAppUrl();
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(stripe, user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout konnte nicht gestartet werden.");
  }

  redirect(session.url);
}

export async function createBillingPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  const customerId = profile?.stripe_customer_id || (await getOrCreateStripeCustomer(stripe, user));

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard`,
  });

  redirect(session.url);
}
