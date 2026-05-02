// Cities of first entry into each Schengen country — verified against major international airports.
// Croatia joined Schengen Jan 2023. Bulgaria/Romania have partial Schengen membership (air/sea) from Mar 2024.
const CITIES: Record<string, string[]> = {
  austria: ["Vienna", "Salzburg", "Innsbruck", "Graz", "Other"],
  belgium: ["Brussels", "Charleroi", "Liège", "Antwerp", "Other"],
  "czech-republic": ["Prague", "Brno", "Ostrava", "Other"],
  denmark: ["Copenhagen", "Billund", "Aalborg", "Other"],
  estonia: ["Tallinn", "Tartu", "Other"],
  finland: ["Helsinki", "Tampere", "Turku", "Oulu", "Other"],
  france: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg", "Toulouse", "Other"],
  germany: ["Frankfurt", "Munich", "Berlin", "Hamburg", "Düsseldorf", "Cologne", "Stuttgart", "Nuremberg", "Other"],
  greece: ["Athens", "Thessaloniki", "Heraklion", "Rhodes", "Corfu", "Santorini", "Mykonos", "Other"],
  hungary: ["Budapest", "Debrecen", "Other"],
  iceland: ["Keflavik (Reykjavik)", "Akureyri", "Other"],
  italy: ["Rome", "Milan", "Venice", "Florence", "Naples", "Bologna", "Turin", "Catania", "Palermo", "Other"],
  latvia: ["Riga", "Other"],
  liechtenstein: ["Zurich (via Switzerland)", "Basel (via Switzerland)", "Feldkirch (via Austria)", "Other"],
  lithuania: ["Vilnius", "Kaunas", "Klaipėda", "Other"],
  luxembourg: ["Luxembourg City", "Other"],
  malta: ["Valletta", "Other"],
  netherlands: ["Amsterdam", "Eindhoven", "Rotterdam", "Other"],
  norway: ["Oslo", "Bergen", "Stavanger", "Trondheim", "Tromsø", "Other"],
  poland: ["Warsaw", "Kraków", "Gdańsk", "Wrocław", "Poznań", "Katowice", "Other"],
  portugal: ["Lisbon", "Porto", "Faro", "Funchal (Madeira)", "Other"],
  slovakia: ["Bratislava", "Košice", "Other"],
  slovenia: ["Ljubljana", "Other"],
  spain: ["Madrid", "Barcelona", "Málaga", "Valencia", "Seville", "Bilbao", "Palma", "Alicante", "Other"],
  sweden: ["Stockholm", "Gothenburg", "Malmö", "Other"],
  switzerland: ["Zurich", "Geneva", "Basel", "Other"],
  // Croatia joined Schengen Jan 2023
  croatia: ["Zagreb", "Split", "Dubrovnik", "Other"],
  // Bulgaria & Romania have partial Schengen (air/sea) from Mar 2024
  bulgaria: ["Sofia", "Varna", "Burgas", "Other"],
  romania: ["Bucharest", "Cluj-Napoca", "Timișoara", "Other"],
};

const FALLBACK = ["Main City", "Other"];

export function getEntryCities(countrySlug: string): string[] {
  return CITIES[countrySlug] ?? FALLBACK;
}
