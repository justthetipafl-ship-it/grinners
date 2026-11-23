import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { getLanding } from "@/lib/landing";

type Props = { params: Promise<{ category: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landing = await getLanding(`/tools/category/${(await params).category}`);
  return landing ? { title: landing.title, description: landing.intro, alternates: { canonical: landing.path } } : {};
}

export default async function CategoryLandingPage({ params }: Props) {
  const landing = await getLanding(`/tools/category/${(await params).category}`);
  if (!landing) notFound();
  return <LandingPage landing={landing} />;
}
