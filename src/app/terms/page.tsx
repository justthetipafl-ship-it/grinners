import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of use", description: "The terms for using Grinners." };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted [&_h2]:mt-3 [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_a]:text-fg [&_a]:underline">
      <h1 className="display text-4xl uppercase text-fg">Terms of use</h1>
      <p>By using Grinners you agree to these terms.</p>
      <h2>Adults only</h2>
      <p>Grinners is for people aged 18 and over.</p>
      <h2>Information, not advice</h2>
      <p>Everything on Grinners is general information and opinion. It is not financial or betting advice. Tips can lose, and past results do not predict future results. You are responsible for your own decisions.</p>
      <h2>Other people&apos;s services</h2>
      <p>Listings link to websites and services we don&apos;t run. We&apos;re not responsible for them, their prices or their claims. Check that any betting service you use is licensed where you live.</p>
      <h2>Affiliate links</h2>
      <p>Some links earn us a commission. They are labelled. See <Link href="/how-we-make-money">how we make money</Link>.</p>
      <h2>Your suggestions</h2>
      <p>If you suggest a listing, you confirm the details are accurate and that you&apos;re allowed to share them.</p>
      <h2>Changes</h2>
      <p>We may update these terms. The current version is always on this page.</p>
    </div>
  );
}
