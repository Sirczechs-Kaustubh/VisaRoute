import { notFound } from "next/navigation";
import type { CountryDetail, DocumentRequirementResponse, VisaTypeOption } from "@/lib/contracts";
import { CountriesService } from "@/server/countries/countries.service";
import { RulesService } from "@/server/rules/rules.service";
import { CountryPageClient } from "./CountryPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const countriesService = new CountriesService();
const rulesService = new RulesService();

export async function generateStaticParams() {
  const countries = await countriesService.listCountries({});
  return countries.map((country) => ({ slug: country.slug }));
}

export default async function CountryPage({ params }: PageProps) {
  const { slug } = await params;
  let country: CountryDetail | null = null;
  let visaTypes: VisaTypeOption[] = [];
  let initialRequirements: DocumentRequirementResponse | null = null;

  try {
    country = await countriesService.getCountryBySlug(slug);
    visaTypes = await rulesService.listVisaTypesForCountryGroup(country.countryGroupCode);
    const defaultVisaCode = visaTypes[0]?.code ?? "schengen-tourism";
    initialRequirements = await rulesService.getDocumentRequirements(slug, {
      visaTypeCode: defaultVisaCode,
      nationalityCategory: "visa-required",
    });
  } catch {
    country = null;
  }

  if (!country) notFound();

  return (
    <CountryPageClient
      country={country}
      visaTypes={visaTypes}
      initialRequirements={initialRequirements}
    />
  );
}
