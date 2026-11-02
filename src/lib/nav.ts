export const NAV = [
  { href: "/investor/investments", label: "Dashboard", match: /^\/investor\/(investments|recent_offerings)/ },
  { href: "/investor/opportunities", label: "New Offerings", match: /^\/investor\/opportunities/, badge: "newOfferings" },
  { href: "/investor/taxes", label: "Tax Forms", match: /^\/investor\/taxes/ },
  { href: "/investor/documents", label: "Documents", match: /^\/investor\/documents/ },
  { href: "/investor/transactions", label: "Transactions", match: /^\/investor\/transactions/ },
  { href: "/investor/contact_us", label: "Contact Us", match: /^\/investor\/contact_us/ },
  { href: "/investor/settings/profile", label: "My Profile", match: /^\/investor\/settings/ },
] as const;
export const KNOWLEDGE_BASE_URL = "https://cardonecapital.com/";
export const FIRM = { name: "Cardone Capital", phone: "+1 302 627 3325", phone2: "+1 650 454 0345", email: "invest@cardonecapitalportal.us", site: "https://cardonecapital.com/", addr1: "18851 NE 29th Ave Suite 1000", addr2: "Aventura, FL 33180" };
export const pageTitle = (p: string) => `${p} | Cardone Capital | Investor Portal`;
