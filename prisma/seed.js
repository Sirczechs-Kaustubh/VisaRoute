const { PrismaClient, Region, NationalityCategory } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── Country Groups ──────────────────────────────────────
const countryGroups = [
  {
    code: "schengen",
    name: "Schengen Area",
    description: "26 European countries with a unified visa policy",
    defaultCurrency: "EUR",
    coverLetterTemplate: null, // Uses built-in default
  },
  {
    code: "uk",
    name: "United Kingdom",
    description: "UK visitor and immigration visas",
    defaultCurrency: "GBP",
    coverLetterTemplate: null,
  },
  {
    code: "us",
    name: "United States",
    description: "US non-immigrant and immigrant visas",
    defaultCurrency: "USD",
    coverLetterTemplate: null,
  },
  {
    code: "canada",
    name: "Canada",
    description: "Canadian visitor and immigration visas",
    defaultCurrency: "CAD",
    coverLetterTemplate: null,
  },
  {
    code: "australia",
    name: "Australia",
    description: "Australian visitor and immigration visas",
    defaultCurrency: "AUD",
    coverLetterTemplate: null,
  },
];

// ─── Schengen Countries ──────────────────────────────────
const schengenCountries = [
  ["austria", "Austria", "AT", "WESTERN_EUROPE", 80, 99, 15, 45, 4],
  ["belgium", "Belgium", "BE", "WESTERN_EUROPE", 80, 99, 15, 45, 4],
  ["france", "France", "FR", "WESTERN_EUROPE", 80, 99, 15, 45, 6],
  ["germany", "Germany", "DE", "WESTERN_EUROPE", 80, 99, 15, 45, 5],
  ["luxembourg", "Luxembourg", "LU", "WESTERN_EUROPE", 80, 99, 15, 45, 3],
  ["netherlands", "Netherlands", "NL", "WESTERN_EUROPE", 80, 99, 15, 45, 5],
  ["switzerland", "Switzerland", "CH", "WESTERN_EUROPE", 80, 99, 15, 45, 4],
  ["denmark", "Denmark", "DK", "NORDIC", 80, 99, 15, 45, 4],
  ["finland", "Finland", "FI", "NORDIC", 80, 99, 15, 45, 4],
  ["iceland", "Iceland", "IS", "NORDIC", 80, 99, 15, 45, 4],
  ["norway", "Norway", "NO", "NORDIC", 80, 99, 15, 45, 4],
  ["sweden", "Sweden", "SE", "NORDIC", 80, 99, 15, 45, 4],
  ["czech-republic", "Czech Republic", "CZ", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["estonia", "Estonia", "EE", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["hungary", "Hungary", "HU", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["latvia", "Latvia", "LV", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["lithuania", "Lithuania", "LT", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["poland", "Poland", "PL", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 4],
  ["slovakia", "Slovakia", "SK", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["slovenia", "Slovenia", "SI", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["croatia", "Croatia", "HR", "SOUTHERN_EUROPE", 80, 99, 15, 45, 4],
  ["greece", "Greece", "GR", "SOUTHERN_EUROPE", 80, 99, 15, 45, 4],
  ["italy", "Italy", "IT", "SOUTHERN_EUROPE", 80, 99, 15, 45, 6],
  ["malta", "Malta", "MT", "SOUTHERN_EUROPE", 80, 99, 15, 45, 3],
  ["portugal", "Portugal", "PT", "SOUTHERN_EUROPE", 80, 99, 15, 45, 4],
  ["spain", "Spain", "ES", "SOUTHERN_EUROPE", 80, 99, 15, 45, 6],
  ["bulgaria", "Bulgaria", "BG", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["romania", "Romania", "RO", "CENTRAL_EASTERN_EUROPE", 80, 99, 15, 45, 3],
  ["liechtenstein", "Liechtenstein", "LI", "WESTERN_EUROPE", 80, 99, 15, 45, 4],
];

// ─── Non-Schengen Countries ─────────────────────────────
const ukCountries = [
  ["united-kingdom", "United Kingdom", "GB", "BRITISH_ISLES", 100, 120, 15, 60, 6],
];

const usCountries = [
  ["united-states", "United States", "US", "NORTH_AMERICA", 160, 0, 30, 120, 8],
];

const canadaCountries = [
  ["canada", "Canada", "CA", "NORTH_AMERICA", 100, 0, 20, 60, 6],
];

const australiaCountries = [
  ["australia", "Australia", "AU", "OCEANIA", 145, 0, 20, 90, 6],
];

const allCountryEntries = [
  ...schengenCountries.map((c) => [...c, "schengen"]),
  ...ukCountries.map((c) => [...c, "uk"]),
  ...usCountries.map((c) => [...c, "us"]),
  ...canadaCountries.map((c) => [...c, "canada"]),
  ...australiaCountries.map((c) => [...c, "australia"]),
];

// ─── Visa Types ──────────────────────────────────────────
const visaTypes = [
  ["short-stay-tourism", "Short-stay (Tourism)", "short-stay", 1],
  ["short-stay-business", "Short-stay (Business)", "short-stay", 2],
  ["airport-transit", "Airport transit", "transit", 3],
  ["long-stay", "Long-stay / National visa", "long-stay", 4],
  ["uk-visitor", "UK Standard Visitor Visa", "visitor", 5],
  ["us-b1b2", "US B1/B2 Visitor Visa", "visitor", 6],
  ["canada-visitor", "Canada Visitor Visa", "visitor", 7],
  ["australia-visitor", "Australia Visitor Visa (subclass 600)", "visitor", 8],
];

// ─── Document Templates ─────────────────────────────────
const documentTemplates = [
  ["passport", "Valid passport", "Valid for at least 3 months beyond your intended departure from the Schengen area, issued in the last 10 years, with at least 2 blank pages.", true, NationalityCategory.ALL, ["short-stay-tourism", "short-stay-business", "airport-transit", "long-stay", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["application-form", "Visa application form", "Fully completed and signed visa application form.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "airport-transit", "long-stay", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["photo", "Passport-size photo", "Recent colour photo (35x45 mm) meeting ICAO standards.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "airport-transit", "long-stay", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["travel-insurance", "Travel health insurance", "Coverage of at least EUR 30,000 for medical emergencies and repatriation, valid for the entire stay in the Schengen area.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "long-stay"]],
  ["itinerary", "Travel itinerary", "Round-trip or multi-destination booking (flights, trains) or detailed plan with dates.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["accommodation", "Proof of accommodation", "Hotel reservations, rental agreement, or invitation letter covering the full stay.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "long-stay", "uk-visitor", "canada-visitor", "australia-visitor"]],
  ["financial", "Proof of sufficient means", "Bank statements, sponsorship letter, or proof of employment or income demonstrating ability to cover the trip.", true, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "long-stay", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["employment", "Employment proof", "Employment letter, leave approval, or for self-employed applicants: business registration and tax returns.", false, NationalityCategory.VISA_REQUIRED, ["short-stay-tourism", "short-stay-business", "uk-visitor", "us-b1b2", "canada-visitor", "australia-visitor"]],
  ["invitation", "Invitation letter (if applicable)", "For business or family visits: signed invitation from host with their ID and address.", false, NationalityCategory.VISA_REQUIRED, ["short-stay-business", "uk-visitor"]],
  ["transit-visa", "Destination country visa (for transit)", "If applying for airport transit visa: visa or residence permit for your final destination country.", true, NationalityCategory.VISA_REQUIRED, ["airport-transit"]],
];

// ─── Process Steps ───────────────────────────────────────
const processSteps = [
  ["initiate", "Process initiation", "Our team contacts you within 2 hours."],
  ["review", "Application review", "Documents checked and any gaps flagged."],
  ["appointment", "Appointment picked", "Earliest available slot confirmed."],
  ["biometric", "Day of biometric", "You attend VFS or consulate with your document pack."],
  ["decision", "Visa decision", "Passport returned with visa sticker."],
];

// ─── Rejection Reasons ──────────────────────────────────
const rejectionReasons = [
  ["purpose-unclear", "Unclear purpose of stay", "The stated purpose of travel is inconsistent with documents or itinerary."],
  ["insufficient-funds", "Insufficient financial means", "Bank statements or financial proof do not demonstrate adequate funds."],
  ["document-issues", "Missing or unreliable supporting documents", "Required documents are missing, incomplete, or not credible."],
  ["travel-insurance", "Inadequate travel insurance", "The insurance policy is missing or below the required threshold."],
  ["return-risk", "Concerns about intention to leave", "The application does not sufficiently prove return intent after the trip."],
];

// ─── Check Rules (per country group) ────────────────────
const checkRules = [
  // Schengen rules
  { ruleCode: "passport_expiry", countryGroupCode: "schengen", title: "Passport expiry buffer", description: "Passport must be valid 3 months beyond return date", parameters: { passportExpiryBufferDays: 90, passportExpiryLabel: "3 months" }, sortOrder: 1 },
  { ruleCode: "trip_duration", countryGroupCode: "schengen", title: "Max stay duration", description: "90 days in any 180-day period", parameters: { maxStayDays: 90, tripDurationLabel: "90-day short-stay" }, sortOrder: 2 },
  { ruleCode: "required_documents", countryGroupCode: "schengen", title: "Required documents", description: "Schengen document requirements", parameters: { requireResidenceDoc: true }, sortOrder: 3 },

  // UK rules
  { ruleCode: "passport_expiry", countryGroupCode: "uk", title: "Passport expiry buffer", description: "Passport must be valid for the duration of stay", parameters: { passportExpiryBufferDays: 0, passportExpiryLabel: "the duration of your stay" }, sortOrder: 1 },
  { ruleCode: "trip_duration", countryGroupCode: "uk", title: "Max stay duration", description: "Up to 6 months on Standard Visitor Visa", parameters: { maxStayDays: 180, tripDurationLabel: "6-month visitor" }, sortOrder: 2 },
  { ruleCode: "required_documents", countryGroupCode: "uk", title: "Required documents", description: "UK visa document requirements", parameters: { requireResidenceDoc: false }, sortOrder: 3 },

  // US rules
  { ruleCode: "passport_expiry", countryGroupCode: "us", title: "Passport expiry buffer", description: "Passport must be valid 6 months beyond intended stay", parameters: { passportExpiryBufferDays: 180, passportExpiryLabel: "6 months" }, sortOrder: 1 },
  { ruleCode: "trip_duration", countryGroupCode: "us", title: "Max stay duration", description: "Up to 6 months on B1/B2", parameters: { maxStayDays: 180, tripDurationLabel: "6-month B1/B2" }, sortOrder: 2 },
  { ruleCode: "required_documents", countryGroupCode: "us", title: "Required documents", description: "US visa document requirements", parameters: { requireResidenceDoc: false }, sortOrder: 3 },

  // Canada rules
  { ruleCode: "passport_expiry", countryGroupCode: "canada", title: "Passport expiry buffer", description: "Passport must be valid for the duration of stay", parameters: { passportExpiryBufferDays: 30, passportExpiryLabel: "1 month" }, sortOrder: 1 },
  { ruleCode: "trip_duration", countryGroupCode: "canada", title: "Max stay duration", description: "Up to 6 months", parameters: { maxStayDays: 180, tripDurationLabel: "6-month visitor" }, sortOrder: 2 },
  { ruleCode: "required_documents", countryGroupCode: "canada", title: "Required documents", description: "Canada visa document requirements", parameters: { requireResidenceDoc: false }, sortOrder: 3 },

  // Australia rules
  { ruleCode: "passport_expiry", countryGroupCode: "australia", title: "Passport expiry buffer", description: "Passport must be valid 6 months beyond travel dates", parameters: { passportExpiryBufferDays: 180, passportExpiryLabel: "6 months" }, sortOrder: 1 },
  { ruleCode: "trip_duration", countryGroupCode: "australia", title: "Max stay duration", description: "Up to 12 months on subclass 600", parameters: { maxStayDays: 365, tripDurationLabel: "12-month visitor" }, sortOrder: 2 },
  { ruleCode: "required_documents", countryGroupCode: "australia", title: "Required documents", description: "Australia visa document requirements", parameters: { requireResidenceDoc: false }, sortOrder: 3 },
];

// ─── Service Tiers ───────────────────────────────────────
const serviceTiers = [
  {
    code: "diy",
    name: "DIY",
    description: "Download your generated pack and apply yourself",
    priceGBP: 0,
    features: JSON.stringify(["Generated cover letter", "Document checklist", "Application summary"]),
    sortOrder: 1,
  },
  {
    code: "standard",
    name: "Standard",
    description: "We review your application and provide feedback",
    priceGBP: 4900,
    features: JSON.stringify(["Everything in DIY", "Expert review of documents", "Feedback within 24 hours", "Email support"]),
    sortOrder: 2,
  },
  {
    code: "premium",
    name: "Premium",
    description: "Full concierge service — we handle everything",
    priceGBP: 9900,
    features: JSON.stringify(["Everything in Standard", "We fill and submit your application", "Appointment booking", "Priority support", "Dedicated case manager"]),
    sortOrder: 3,
  },
];

// ─── Helpers ─────────────────────────────────────────────

function getImageUrl(slug) {
  return `https://picsum.photos/seed/${slug}/600/400`;
}

function getHeroUrl(slug) {
  return `https://picsum.photos/seed/${slug}-hero/1600/500`;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  // Clear existing data (order matters for FK constraints)
  await prisma.appointmentAvailabilitySnapshot.deleteMany();
  await prisma.appointmentAlertSubscription.deleteMany();
  await prisma.refusalHistoryEntry.deleteMany();
  await prisma.visaHistoryEntry.deleteMany();
  await prisma.employmentProfile.deleteMany();
  await prisma.companionGroup.deleteMany();
  await prisma.travelPlan.deleteMany();
  await prisma.applicantProfile.deleteMany();
  await prisma.order.deleteMany();
  await prisma.generatedPack.deleteMany();
  await prisma.checkResult.deleteMany();
  await prisma.application.deleteMany();
  await prisma.rejectionReason.deleteMany();
  await prisma.visaProcessStep.deleteMany();
  await prisma.documentRequirement.deleteMany();
  await prisma.countryVisaProfile.deleteMany();
  await prisma.checkRule.deleteMany();
  await prisma.country.deleteMany();
  await prisma.countryGroup.deleteMany();
  await prisma.visaType.deleteMany();
  await prisma.serviceTier.deleteMany();

  // 1. Country Groups
  for (const group of countryGroups) {
    await prisma.countryGroup.create({ data: group });
  }

  // 2. Visa Types
  const visaTypeMap = new Map();
  for (const [code, label, category, sortOrder] of visaTypes) {
    const visaType = await prisma.visaType.create({
      data: { code, label, category, sortOrder },
    });
    visaTypeMap.set(code, visaType.id);
  }

  // 3. Countries
  for (const [index, entry] of allCountryEntries.entries()) {
    const [slug, name, code, region, visaFeeEur, serviceFeeEur, processingDaysMin, processingDaysMax, appointmentLeadWeeks, groupCode] = entry;

    const country = await prisma.country.create({
      data: {
        slug,
        name,
        code,
        region: Region[region],
        countryGroupCode: groupCode,
        displayOrder: index + 1,
        cardImageUrl: getImageUrl(slug),
        heroImageUrl: getHeroUrl(slug),
        visaFeeEur,
        serviceFeeEur,
        processingDaysMin,
        processingDaysMax,
        appointmentLeadWeeks,
      },
    });

    const stayLimit = groupCode === "schengen" ? 90
      : groupCode === "australia" ? 365
      : 180;

    await prisma.countryVisaProfile.create({
      data: {
        countryId: country.id,
        visaStayLimitDays: stayLimit,
        entryTypeDefault: groupCode === "schengen" ? "Multiple" : "Single",
        approvalRatePercent: 89,
        overviewText: `Everything you need to know about the visa for ${name}.`,
        importantNotes: `Appointment demand and document review complexity vary for ${name}.`,
        disclaimerText: "Initial backend seed data based on the current frontend prototype.",
      },
    });
  }

  // 4. Document Requirements
  for (const [sortOrder, [code, name, description, required, nationalityCategory, visaTypeCodes]] of documentTemplates.entries()) {
    for (const visaTypeCode of visaTypeCodes) {
      const visaTypeId = visaTypeMap.get(visaTypeCode);
      if (!visaTypeId) continue;
      await prisma.documentRequirement.create({
        data: {
          code,
          name,
          description,
          required,
          nationalityCategory,
          sortOrder: sortOrder + 1,
          visaTypeId,
        },
      });
    }
  }

  // 5. Process Steps
  for (const [sortOrder, [code, title, description]] of processSteps.entries()) {
    await prisma.visaProcessStep.create({
      data: { code, title, description, sortOrder: sortOrder + 1 },
    });
  }

  // 6. Rejection Reasons
  for (const [sortOrder, [code, title, description]] of rejectionReasons.entries()) {
    await prisma.rejectionReason.create({
      data: { code, title, description, sortOrder: sortOrder + 1 },
    });
  }

  // 7. Check Rules
  for (const rule of checkRules) {
    await prisma.checkRule.create({
      data: {
        ruleCode: rule.ruleCode,
        countryGroupCode: rule.countryGroupCode,
        title: rule.title,
        description: rule.description,
        parameters: JSON.stringify(rule.parameters),
        sortOrder: rule.sortOrder,
      },
    });
  }

  // 8. Service Tiers
  for (const tier of serviceTiers) {
    await prisma.serviceTier.create({ data: tier });
  }

  console.log("Seed complete:");
  console.log(`  ${countryGroups.length} country groups`);
  console.log(`  ${allCountryEntries.length} countries`);
  console.log(`  ${visaTypes.length} visa types`);
  console.log(`  ${checkRules.length} check rules`);
  console.log(`  ${serviceTiers.length} service tiers`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
