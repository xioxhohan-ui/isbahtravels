import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount).replace("BDT", "৳");
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function detectCountryFlagUrl(countryName: string): string {
  if (!countryName) return "https://flagcdn.com/w80/un.png";
  const normalized = countryName.toLowerCase().trim();

  const map: Record<string, string> = {
    "saudi arabia": "sa",
    "saudi": "sa",
    "umrah": "sa",
    "mecca": "sa",
    "medina": "sa",
    "dubai": "ae",
    "uae": "ae",
    "united arab emirates": "ae",
    "thailand": "th",
    "bangkok": "th",
    "malaysia": "my",
    "kuala lumpur": "my",
    "singapore": "sg",
    "turkey": "tr",
    "turkiye": "tr",
    "istanbul": "tr",
    "japan": "jp",
    "tokyo": "jp",
    "usa": "us",
    "united states": "us",
    "america": "us",
    "uk": "gb",
    "united kingdom": "gb",
    "england": "gb",
    "london": "gb",
    "canada": "ca",
    "toronto": "ca",
    "france": "fr",
    "paris": "fr",
    "germany": "de",
    "berlin": "de",
    "italy": "it",
    "rome": "it",
    "schengen": "eu",
    "europe": "eu",
    "china": "cn",
    "beijing": "cn",
    "india": "in",
    "delhi": "in",
    "vietnam": "vn",
    "indonesia": "id",
    "bali": "id",
    "qatar": "qa",
    "doha": "qa",
    "oman": "om",
    "muscat": "om",
    "kuwait": "kw",
    "bahrain": "bh",
    "egypt": "eg",
    "cairo": "eg",
    "australia": "au",
    "sydney": "au",
    "south korea": "kr",
    "korea": "kr",
    "seoul": "kr",
    "maldives": "mv",
    "sri lanka": "lk",
    "colombo": "lk",
    "nepal": "np",
    "kathmandu": "np",
    "bangladesh": "bd",
    "dhaka": "bd",
  };

  for (const [key, code] of Object.entries(map)) {
    if (normalized.includes(key)) {
      return `https://flagcdn.com/w80/${code}.png`;
    }
  }

  const clean = normalized.replace(/[^a-z]/g, "");
  const code = clean.substring(0, 2);
  return `https://flagcdn.com/w80/${code.length === 2 ? code : "un"}.png`;
}
