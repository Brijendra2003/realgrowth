-- Real Growth — full postal address on listings
-- Run once in the Supabase SQL editor, after 0003_buyer_requirements.sql.
--
-- A listing used to carry only an area and one "street or landmark" line.
-- It now also has the building or society name, a landmark and the PIN code.
-- address_line stays as the street / road. The new columns are nullable so
-- listings saved before this change keep working; the form asks for a PIN
-- code on every new save.

begin;

alter table projects
  add column if not exists building_name text,
  add column if not exists landmark text,
  add column if not exists pincode text check (pincode is null or pincode ~ '^\d{6}$');

commit;
