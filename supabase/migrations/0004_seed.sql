-- Sample catalog. Images are local placeholders in /public/placeholders.

insert into public.categories (id, name, slug, description, display_order, is_active) values
  ('11111111-1111-4111-8111-111111111001', 'Sofas', 'sofas', 'Lounge sofas and sectional seating.', 1, true),
  ('11111111-1111-4111-8111-111111111002', 'Beds', 'beds', 'Bedroom beds and frames.', 2, true),
  ('11111111-1111-4111-8111-111111111003', 'Dining Tables', 'dining-tables', 'Dining tables for home.', 3, true),
  ('11111111-1111-4111-8111-111111111004', 'Chairs', 'chairs', 'Dining and accent chairs.', 4, true),
  ('11111111-1111-4111-8111-111111111005', 'Gaming Chairs', 'gaming-chairs', 'Performance seating for work and play.', 5, true),
  ('11111111-1111-4111-8111-111111111006', 'Office Tables', 'office-tables', 'Desks and office tables.', 6, true),
  ('11111111-1111-4111-8111-111111111007', 'Office Chairs', 'office-chairs', 'Task and executive chairs.', 7, true),
  ('11111111-1111-4111-8111-111111111008', 'Workstations', 'workstations', 'Modular workstations.', 8, true),
  ('11111111-1111-4111-8111-111111111009', 'Conference Tables', 'conference-tables', 'Meeting and conference tables.', 9, true)
on conflict (slug) do nothing;

insert into public.products (
  id, category_id, name, slug, sku, short_description, full_description,
  base_price_paise, gst_percent, material, dimensions, colour,
  is_featured, is_active, min_units, booking_window_days, delivery_estimate, display_order,
  seo_title, seo_description
) values
(
  '22222222-2222-4222-8222-222222222001',
  '11111111-1111-4111-8111-111111111003',
  'Modern 6-Seater Dining Table',
  'modern-6-seater-dining-table',
  'DT001',
  'A clean, modern dining table sized for six. Sample product for preview.',
  'Sample product. Replace this copy and photography with your actual dining table details. Group booking: pay 10% now. Remaining 90% after arrival in Hyderabad.',
  3000000, 18, 'Engineered wood + metal', '180 × 90 × 75 cm', 'Oak / Black metal',
  true, true, 5, 7, '30–40 days', 1,
  'Modern 6-Seater Dining Table | ImportNow',
  'Premium imported 6-seater dining table at factory-level pricing. Pay 10% to book.'
),
(
  '22222222-2222-4222-8222-222222222002',
  '11111111-1111-4111-8111-111111111001',
  'Premium L-Shaped Sofa',
  'premium-l-shaped-sofa',
  'SF001',
  'Sectional sofa for living rooms. Sample product for preview.',
  'Sample product. Replace images and specifications before taking live orders.',
  4850000, 18, 'Fabric upholstery + wood frame', '280 × 180 × 85 cm', 'Warm grey',
  true, true, 5, 7, '30–40 days', 2,
  'Premium L-Shaped Sofa | ImportNow',
  'Imported L-shaped sofa sourced from manufacturers in China. Book with 10% advance.'
),
(
  '22222222-2222-4222-8222-222222222003',
  '11111111-1111-4111-8111-111111111007',
  'Executive Office Chair',
  'executive-office-chair',
  'OC001',
  'High-back executive chair. Sample product for preview.',
  'Sample product. Confirm measurements and finish with ImportNow before ordering in volume.',
  1250000, 18, 'Leatherette + metal base', '70 × 70 × 120 cm', 'Black',
  true, true, 5, 7, '30–40 days', 3,
  'Executive Office Chair | ImportNow',
  'Factory-priced executive office chair. Group order with 10% booking amount.'
),
(
  '22222222-2222-4222-8222-222222222004',
  '11111111-1111-4111-8111-111111111008',
  'Modern Workstation',
  'modern-workstation',
  'WS001',
  'Two-person workstation. Sample product for preview.',
  'Sample product for office furniture group orders.',
  2200000, 18, 'Engineered wood + powder-coated steel', '150 × 150 × 75 cm', 'White / Grey',
  true, true, 5, 7, '30–40 days', 4,
  'Modern Workstation | ImportNow',
  'Imported office workstation at factory-level pricing.'
),
(
  '22222222-2222-4222-8222-222222222005',
  '11111111-1111-4111-8111-111111111009',
  'Conference Table',
  'conference-table',
  'CT001',
  'Eight-seater conference table. Sample product for preview.',
  'Sample product. Suitable for meeting rooms once the group order threshold is reached.',
  4200000, 18, 'Engineered wood + metal', '240 × 120 × 75 cm', 'Walnut',
  true, true, 5, 7, '30–40 days', 5,
  'Conference Table | ImportNow',
  'Premium imported conference table. Book with 10% today.'
),
(
  '22222222-2222-4222-8222-222222222006',
  '11111111-1111-4111-8111-111111111005',
  'Gaming Chair',
  'gaming-chair',
  'GC001',
  'Ergonomic gaming chair. Sample product for preview.',
  'Sample product. Replace photography before publishing live inventory.',
  980000, 18, 'PU leather + steel frame', '70 × 70 × 130 cm', 'Black / Red',
  false, true, 5, 7, '30–40 days', 6,
  'Gaming Chair | ImportNow',
  'Imported gaming chair with factory-level pricing and 10% booking.'
),
(
  '22222222-2222-4222-8222-222222222007',
  '11111111-1111-4111-8111-111111111002',
  'King Size Bed',
  'king-size-bed',
  'BD001',
  'King-size bed frame. Sample product for preview.',
  'Sample product. Mattress not included unless listed separately.',
  3600000, 18, 'Engineered wood', '210 × 190 × 110 cm', 'Natural oak',
  true, true, 5, 7, '30–40 days', 7,
  'King Size Bed | ImportNow',
  'Imported king size bed frame. Pay 10% to join the group order.'
),
(
  '22222222-2222-4222-8222-222222222008',
  '11111111-1111-4111-8111-111111111006',
  'Premium Office Table',
  'premium-office-table',
  'OT001',
  'Executive office table. Sample product for preview.',
  'Sample product for office table group bookings.',
  2750000, 18, 'Engineered wood + metal', '160 × 80 × 75 cm', 'Walnut / Black',
  false, true, 5, 7, '30–40 days', 8,
  'Premium Office Table | ImportNow',
  'Factory-priced office table imported from China.'
)
on conflict (slug) do nothing;

insert into public.product_images (product_id, url, alt_text, is_primary, display_order) values
  ('22222222-2222-4222-8222-222222222001', '/placeholders/dining-table.svg', 'Sample dining table placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222001', '/placeholders/dining-table-2.svg', 'Sample dining table detail placeholder', false, 2),
  ('22222222-2222-4222-8222-222222222002', '/placeholders/sofa.svg', 'Sample sofa placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222003', '/placeholders/office-chair.svg', 'Sample office chair placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222004', '/placeholders/workstation.svg', 'Sample workstation placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222005', '/placeholders/conference.svg', 'Sample conference table placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222006', '/placeholders/gaming-chair.svg', 'Sample gaming chair placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222007', '/placeholders/bed.svg', 'Sample bed placeholder', true, 1),
  ('22222222-2222-4222-8222-222222222008', '/placeholders/office-table.svg', 'Sample office table placeholder', true, 1);

insert into public.product_variants (product_id, name, value) values
  ('22222222-2222-4222-8222-222222222001', 'Finish', 'Oak'),
  ('22222222-2222-4222-8222-222222222001', 'Finish', 'Walnut'),
  ('22222222-2222-4222-8222-222222222002', 'Colour', 'Warm grey'),
  ('22222222-2222-4222-8222-222222222002', 'Colour', 'Ivory');
