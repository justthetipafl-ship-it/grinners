import type { Metadata } from "next";
import { SuggestForm } from "@/components/PublicForms";

export const metadata: Metadata = {
  title: "Suggest a listing",
  description: "Know a tipster, tool, podcast or channel that belongs on Grinners? Tell us.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Suggest a listing</h1>
      <p className="mt-2 text-muted">
        Know someone who belongs here, or want your own work listed? Send it through. Listings are free. We check every suggestion and
        don&apos;t list anyone who promotes unlicensed betting services or promises guaranteed profits.
      </p>
      <div className="mt-8">
        <SuggestForm />
      </div>
    </div>
  );
}
