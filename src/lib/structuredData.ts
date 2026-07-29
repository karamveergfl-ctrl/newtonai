/**
 * Shared JSON-LD (schema.org) builders used by SEOHead across routes.
 */

export const SITE_URL = "https://newtonai.site";
export const SITE_NAME = "NewtonAI";

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQPage schema built from a list of question/answer pairs. */
export const buildFaqSchema = (faqs: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
});

/** WebPage schema describing a single route. */
export const buildWebPageSchema = ({
  name,
  description,
  path,
  primaryTopic,
}: {
  name: string;
  description: string;
  path: string;
  primaryTopic?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}${path}#webpage`,
  url: `${SITE_URL}${path}`,
  name,
  description,
  inLanguage: "en",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  },
  ...(primaryTopic ? { about: { "@type": "Thing", name: primaryTopic } } : {}),
});

/** SoftwareApplication schema for the product / individual AI tools. */
export const buildSoftwareAppSchema = ({
  name,
  description,
  path = "",
  featureList,
  rating = true,
}: {
  name: string;
  description: string;
  path?: string;
  featureList?: string[];
  rating?: boolean;
}) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name,
  description,
  url: `${SITE_URL}${path}`,
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "AI Study Assistant",
  operatingSystem: "Web",
  ...(featureList ? { featureList } : {}),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available with premium plans for advanced features",
  },
  ...(rating
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "12000",
          bestRating: "5",
        },
      }
    : {}),
});