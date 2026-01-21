-- Insert the NEWTON1000 promo code for 100% discount on Pro Monthly
INSERT INTO redeem_codes (code, discount_percent, max_uses, description, is_active, valid_from, valid_until)
VALUES (
  'NEWTON1000',
  100,
  1000,
  'Free Pro Monthly subscription - Limited time offer',
  true,
  now(),
  '2026-01-30 23:59:59+00'
);