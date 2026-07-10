import { buildMetadata } from "@/lib/seo";
import { getServicePage } from "@/lib/service-pages";
import { ServiceLanding } from "@/components/ServiceLanding";

const page = getServicePage("maintenance-site-web")!;

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: `/services/${page.slug}`,
  keywords: page.keywords,
});

export default function MaintenanceSiteWebPage() {
  return <ServiceLanding page={page} />;
}
