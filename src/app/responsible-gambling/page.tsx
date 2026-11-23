import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responsible gambling",
  description: "Where to get help, and how Grinners approaches betting content.",
};

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted">
      <h1 className="display text-4xl uppercase text-fg">Responsible gambling</h1>
      <p>Grinners is for people aged 18 and over. Betting should be entertainment, never a way to make money or fix a money problem.</p>
      <h2 className="mt-2 font-semibold text-fg">Get help</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Gambling Help: call <a className="text-fg underline" href="tel:1800858858">1800 858 858</a>, free and confidential, 24 hours a day.
        </li>
        <li>
          Chat online at{" "}
          <a className="text-fg underline" href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer">gamblinghelponline.org.au</a>.
        </li>
        <li>
          Block yourself from all licensed Australian online and phone betting at{" "}
          <a className="text-fg underline" href="https://www.betstop.gov.au" target="_blank" rel="noopener noreferrer">BetStop</a>.
        </li>
      </ul>
      <h2 id="international" className="mt-2 scroll-mt-24 font-semibold text-fg">Outside Australia</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          United States: call or text <a className="text-fg underline" href="tel:18004262537">1-800-GAMBLER</a>, the National Problem Gambling Helpline.
        </li>
        <li>
          United Kingdom: call the National Gambling Helpline on <a className="text-fg underline" href="tel:08088020133">0808 8020 133</a>, free, 24 hours a day.
        </li>
        <li>
          New Zealand: call the Gambling Helpline on <a className="text-fg underline" href="tel:0800654655">0800 654 655</a>.
        </li>
        <li>
          Ireland: call the National Gambling Helpline on <a className="text-fg underline" href="tel:1800753753">1800 753 753</a>.
        </li>
        <li>
          Anywhere else: GamCare keeps a{" "}
          <a className="text-fg underline" href="https://gamcare.org.uk/self-help/links-to-other-support-agencies/international-support-contacts/" target="_blank" rel="noopener noreferrer">
            list of support services by country
          </a>
          .
        </li>
      </ul>
      <p>The legal age for betting differs by country and, in the US, by state. Follow the rules where you live.</p>
      <h2 className="mt-2 font-semibold text-fg">Our standards</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Tips are opinions, not advice. Past results do not predict future results.</li>
        <li>We only show a results record for tips posted here before the event started.</li>
        <li>We don&apos;t list creators who promote unlicensed betting services to Australians or who promise guaranteed profits.</li>
        <li>We don&apos;t carry bookmaker advertising.</li>
      </ul>
    </div>
  );
}
