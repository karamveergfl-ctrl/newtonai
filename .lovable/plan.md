

# Plan: Add Adsterra Native Ads to Contact, FAQ, and Pricing Pages

## Summary
This plan adds Adsterra native ads to the remaining three pages (Contact, FAQ, and Pricing) to complete the site-wide ad integration. Each page will get strategically placed ads that don't interfere with the user experience.

---

## Ad Placements by Page

### 1. Contact Page (`src/pages/Contact.tsx`)
**Placement**: Below the contact form grid, before the Footer

| Location | Instance ID |
|----------|-------------|
| After the contact info + form grid (line 129) | `contact-bottom` |

### 2. FAQ Page (`src/pages/FAQ.tsx`)
**Placements**: 
- Between the FAQ accordion and CTA section
- After the CTA section

| Location | Instance ID |
|----------|-------------|
| After FAQ accordion, before CTA (line 139-141) | `faq-middle` |
| After CTA section, before Footer (line 150-151) | `faq-bottom` |

### 3. Pricing Page (`src/pages/Pricing.tsx`)
**Placements**:
- Below pricing cards, before feature comparison table
- After payment info section, before Enterprise CTA

| Location | Instance ID |
|----------|-------------|
| After pricing cards grid (line 399-401) | `pricing-after-cards` |
| After payment info, before Enterprise CTA (line 472-474) | `pricing-before-enterprise` |

---

## Implementation Details

### Contact.tsx Changes
```text
Line 11: Add import for AdsterraNativeBanner
Line 129: Add <AdsterraNativeBanner instanceId="contact-bottom" /> after the grid
```

### FAQ.tsx Changes
```text
Line 8: Add import for AdsterraNativeBanner
Line 139: Add <AdsterraNativeBanner instanceId="faq-middle" /> before CTA section
Line 151: Add <AdsterraNativeBanner instanceId="faq-bottom" /> after CTA section
```

### Pricing.tsx Changes
```text
Line 22: Add import for AdsterraNativeBanner
Line 400: Add <AdsterraNativeBanner instanceId="pricing-after-cards" /> after cards grid
Line 473: Add <AdsterraNativeBanner instanceId="pricing-before-enterprise" /> before Enterprise CTA
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Contact.tsx` | Add import + 1 ad placement |
| `src/pages/FAQ.tsx` | Add import + 2 ad placements |
| `src/pages/Pricing.tsx` | Add import + 2 ad placements |

---

## Total New Placements

| Page | Ad Count |
|------|----------|
| Contact | 1 |
| FAQ | 2 |
| Pricing | 2 |
| **Total** | **5** |

This completes the site-wide Adsterra native ad integration across all pages.

---

## Technical Note
All ads use unique `instanceId` props to ensure the Adsterra script correctly targets each ad container. The existing `AdsterraNativeBanner` component already supports:
- Multiple instances per page via unique container IDs
- Mobile-responsive styling (`px-4 sm:px-0`, `my-6 md:my-8`)
- Overflow handling to prevent horizontal scroll

