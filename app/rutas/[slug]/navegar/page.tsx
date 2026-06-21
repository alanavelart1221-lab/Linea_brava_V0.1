import { notFound } from "next/navigation";
import { NavegarClient } from "@/components/NavegarClient";
import { getRouteBySlug } from "@/lib/routes-data";

export const revalidate = 60;

export default async function NavegarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = await getRouteBySlug(slug);
  if (!trail) notFound();

  return (
    <NavegarClient
      slug={slug}
      name={trail.name}
      track={trail.track}
      center={trail.startCoords ?? { lat: 23.6, lng: -102.5 }}
      distanceKm={trail.distanceKm}
      duration={trail.duration}
      elevationM={trail.elevationM}
    />
  );
}
