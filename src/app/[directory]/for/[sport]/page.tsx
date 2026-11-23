import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { getLanding } from "@/lib/landing";

type Props = { params: Promise<{ directory: string; sport: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { directory, sport } = await params;
  const landing = await getLanding(`/${directory}/for/${sport}`);
  return landing ? { title: landing.title, description: landing.intro, alternates: { canonical: landing.path } } : {};
}

export default async function SportLandingPage({ params }: Props) {
  const { directory, sport } = await params;
  const landing = await getLanding(`/${directory}/for/${sport}`);
  if (!landing) notFound();
  return <LandingPage landing={landing} />;
}
