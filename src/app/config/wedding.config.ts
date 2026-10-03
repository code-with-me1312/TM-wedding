export interface WeddingConfig {
  bride: string;
  groom: string;
  date: string;
  endDate: string;
  dateLabel: string;
  shortDate: string;
  time: string;
  venue: string;
  address: string;
  mapsUrl: string;
  invitationMessage: string;
  closingMessage: string;
  music: string | null;
  photos: readonly { src: string; alt: string }[];
  whatsappTemplate: string;
  theme: {
    burgundy: string;
    ivory: string;
    gold: string;
    orange: string;
    camel: string;
    chocolate: string;
    terracotta: string;
    sage: string;
  };
}
export const wedding: WeddingConfig = {
  bride: "Tasneem",
  groom: "Mostafa",
  date: "2026-11-27T18:00:00+02:00",
  endDate: "2026-11-27T23:00:00+02:00",
  dateLabel: "Friday, November 27, 2026",
  shortDate: "27 · 11 · 2026",
  time: "6:00 PM",
  venue: "Mountain Rose",
  address: "6 October City, Egypt",
  mapsUrl: "https://maps.app.goo.gl/6CV3Kf2958pQxtQo8",
  invitationMessage:
    "Together with our families, we invite you to celebrate the beginning of our forever.",
  closingMessage:
    "The best moments in life are the ones we share. We would be so happy to share this one with you.",
  music: null,
  photos: [],
  whatsappTemplate:
    "Dear {name},\n\nTasneem & Mostafa would love for you to celebrate their wedding with them. ❤️\n\nOpen your invitation:\n{url}",
  theme: {
    burgundy: "#884222",
    ivory: "#f8efdf",
    gold: "#b98932",
    orange: "#ab501c",
    camel: "#d4c3a2",
    chocolate: "#583426",
    terracotta: "#884222",
    sage: "#788675",
  },
};
