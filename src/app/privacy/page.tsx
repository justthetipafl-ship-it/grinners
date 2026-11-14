import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "What Grinners collects and how it is used." };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted [&_h2]:mt-3 [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_a]:text-fg [&_a]:underline">
      <h1 className="display text-4xl uppercase text-fg">Privacy</h1>
      <h2>What we collect</h2>
      <ul>
        <li>Your email address, if you join the newsletter or include it with a suggestion.</li>
        <li>What you tell us in a suggestion.</li>
        <li>A count of clicks on outbound links, with the page it came from and the country. We don&apos;t store your IP address with clicks.</li>
        <li>A note in your own browser that you&apos;ve confirmed you are 18 or over. It never leaves your device.</li>
      </ul>
      <h2>What we use it for</h2>
      <p>To send the newsletter you asked for, to review suggestions, and to understand which listings people find useful.</p>
      <h2>Who we share it with</h2>
      <p>We don&apos;t sell personal information. Our hosting and database providers process it on our behalf.</p>
      <h2>Your choices</h2>
      <p>You can unsubscribe from the newsletter at any time, and you can ask us to delete your details.</p>
      <p className="text-sm">Draft wording. To be reviewed by a lawyer before launch.</p>
    </div>
  );
}
