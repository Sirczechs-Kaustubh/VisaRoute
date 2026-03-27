import { chatCompletion, isAIEnabled } from "@/server/ai/openrouter";
import { jsonResponse, handleRouteError } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/generate-doc
 * Generates a personalised visa document (cover letter, travel statement) using AI.
 */
export async function POST(request: Request) {
  try {
    if (!isAIEnabled()) {
      return jsonResponse(
        { error: { code: "AI_UNAVAILABLE", message: "AI generation is not configured on this server" } },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { docType, data, countryName } = body as {
      docType: string;
      countryName: string;
      data: {
        firstName?: string;
        lastName?: string;
        passportNumber?: string;
        travelStartDate?: string;
        travelEndDate?: string;
        entryCity?: string;
        purposeOfTravel?: string;
        employmentStatus?: string;
        accommodation?: string;
        previousTravelVisits?: { country: string; year: string }[];
        refusalDetails?: { country: string; year: string; reason: string }[];
        countryOfResidence?: string;
        passportNationality?: string;
        companionsCount?: number;
        travellingWithCompanions?: string;
      };
    };

    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Applicant";
    const travelDates =
      data.travelStartDate && data.travelEndDate
        ? `${data.travelStartDate} to ${data.travelEndDate}`
        : "dates not specified";

    const tripDays =
      data.travelStartDate && data.travelEndDate
        ? Math.round((new Date(data.travelEndDate).getTime() - new Date(data.travelStartDate).getTime()) / 86400000)
        : null;

    const purposeMap: Record<string, string> = {
      tourism: "tourism / leisure",
      business: "business meetings",
      visiting: "visiting family and friends",
      study: "study",
      medical: "medical treatment",
      transit: "transit",
    };
    const purposeLabel = purposeMap[data.purposeOfTravel ?? ""] ?? data.purposeOfTravel ?? "tourism";

    let systemPrompt: string;
    let userPrompt: string;

    if (docType === "cover_letter") {
      systemPrompt = `You are an expert visa application consultant who writes personalised, professional cover letters for Schengen visa applications. Write in first person from the applicant's perspective. Be formal but concise (300–400 words). Do NOT use placeholder text like [brackets]. Fill in all details from the data provided. If a detail is missing, write naturally around it without showing placeholders. Start directly with "I, [Name], am writing to apply..." and end with "I kindly request you to consider my application favourably." Output ONLY the letter body, no date, no addressee, no subject, no greeting, no sign-off.`;

      userPrompt = `Write a personalised Schengen visa cover letter for:

Applicant: ${fullName}
Passport nationality: ${data.passportNationality || "Not specified"}${data.passportNumber ? `\nPassport number: ${data.passportNumber}` : ""}
Country of residence: ${data.countryOfResidence || "Not specified"}
Destination: ${countryName}
Purpose: ${purposeLabel}
Travel dates: ${travelDates}${tripDays ? ` (${tripDays} days)` : ""}${data.entryCity ? `\nEntry point: ${data.entryCity}` : ""}${data.accommodation ? `\nAccommodation: ${data.accommodation}` : ""}${data.employmentStatus ? `\nEmployment: ${data.employmentStatus}` : ""}${data.travellingWithCompanions === "yes" && data.companionsCount ? `\nTravelling with: ${data.companionsCount} companion(s)` : ""}${data.previousTravelVisits?.length ? `\nPrevious Schengen visits: ${data.previousTravelVisits.map((v) => `${v.country} (${v.year})`).join(", ")}` : ""}${data.refusalDetails?.length ? `\nPrevious visa refusals (address transparently): ${data.refusalDetails.map((r) => `${r.country} (${r.year})${r.reason ? `: ${r.reason}` : ""}`).join("; ")}` : ""}

Write the full letter body. Mention employment ties and intent to return. If employment status is "employed", mention taking approved annual leave. If "self_employed", mention the business. If "student", mention studies. Do not leave any placeholders.`;
    } else if (docType === "holiday_letter") {
      systemPrompt = `You are an expert visa consultant writing a personalised travel statement for a Schengen visa application. This is the applicant's personal narrative explaining WHY they want to visit, their day-by-day itinerary, and their genuine intent to return home. Write in first person, 350–500 words. Be specific about the destination — mention real attractions, neighbourhoods, or experiences. Do NOT use placeholder text like [brackets] or example-style text. Output ONLY the statement body — no date, no addressee, no subject, no greeting, no sign-off.`;

      userPrompt = `Write a personalised personal travel statement for:

Applicant: ${fullName}
Destination: ${countryName}
Travel dates: ${travelDates}${tripDays ? ` (${tripDays} days)` : ""}
Purpose: ${purposeLabel}
Country of residence: ${data.countryOfResidence || "Not specified"}${data.accommodation ? `\nAccommodation: ${data.accommodation}` : ""}${data.employmentStatus ? `\nEmployment: ${data.employmentStatus}` : ""}${data.travellingWithCompanions === "yes" && data.companionsCount ? `\nTravelling with: ${data.companionsCount} companion(s)` : "\nTravelling alone"}

Include:
1. A heartfelt opening explaining personal motivation for visiting ${countryName}
2. A specific, realistic day-by-day or city-by-city itinerary mentioning real places/attractions
3. Accommodation details (use "booked through [platform]" if not provided)
4. Statement about travelling alone or with companions
5. Strong return intent — mention employment/studies/family commitments at home
Do not use any placeholder text.`;
    } else {
      return jsonResponse(
        { error: { code: "UNSUPPORTED_DOC_TYPE", message: `AI generation not supported for docType: ${docType}` } },
        { status: 400 },
      );
    }

    const result = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.6, maxTokens: 1200 },
    );

    return jsonResponse({ text: result.content.trim() });
  } catch (error) {
    return handleRouteError(error);
  }
}
