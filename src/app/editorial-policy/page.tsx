import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Editorial policy", description: "How Grinners chooses, checks and labels what it publishes." };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted [&_h2]:mt-3 [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_a]:text-fg [&_a]:underline">
      <h1 className="display text-4xl uppercase text-fg">Editorial policy</h1>
      <h2>Who gets listed</h2>
      <ul>
        <li>We list creators and tools we think are useful to punters and fantasy players.</li>
        <li>We don&apos;t list anyone who promotes betting services that aren&apos;t licensed in Australia, or who promises guaranteed profits.</li>
        <li>A listing on its own is not an endorsement, and we remove listings that stop meeting this standard.</li>
      </ul>
      <h2 id="certified">Certified Grinner</h2>
      <ul>
        <li>The Certified Grinner badge goes on listings we have used ourselves and are happy to put our name to.</li>
        <li>A paid product has to give us access first, so we can check it does what it says. That free access is the only thing we receive.</li>
        <li>The badge can&apos;t be bought, and a sponsor or affiliate partner doesn&apos;t get it automatically.</li>
        <li>It says the product or creator is good at what they do. It never says their tips will win, and it isn&apos;t betting advice.</li>
        <li>We take the badge away if the listing stops deserving it.</li>
      </ul>
      <h2>Deals</h2>
      <ul>
        <li>Some listings offer Grinners visitors a discount or trial. Those offers come from the listing, on its own terms.</li>
        <li>We don&apos;t carry sign-up offers from bookmakers or any other betting service.</li>
        <li>If we earn a commission when you take up a deal, the button carries the &ldquo;Affiliate link&rdquo; label.</li>
      </ul>
      <h2>Results and records</h2>
      <ul>
        <li>The only record we show is from tips posted on Grinners before the event started. Those tips are locked at start time and graded afterwards.</li>
        <li>Any other results a creator claims are their own claim and are labelled that way.</li>
      </ul>
      <h2>Paid content</h2>
      <ul>
        <li>Sponsored listings, spotlights and articles carry a &ldquo;Sponsored&rdquo; label.</li>
        <li>Affiliate links carry an &ldquo;Affiliate link&rdquo; label.</li>
        <li>Payment never buys a positive review or a better record.</li>
        <li>Where the people behind Grinners own or have a stake in a listing, the profile says so.</li>
      </ul>
      <h2>Corrections</h2>
      <p>If something here is wrong, tell us through the <Link href="/submit">suggestion form</Link> and we&apos;ll fix it.</p>
    </div>
  );
}
