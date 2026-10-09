-- Reference data: service corridor (Mira Road → Dahanu Road) and property types.
insert into areas (zone, name) values
  ('Mira Road & Bhayandar','Mira Road East'), ('Mira Road & Bhayandar','Mira Road West'), ('Mira Road & Bhayandar','Kashimira'),
  ('Mira Road & Bhayandar','Shanti Park'), ('Mira Road & Bhayandar','Beverly Park'), ('Mira Road & Bhayandar','Silver Park'),
  ('Mira Road & Bhayandar','Sheetal Nagar'), ('Mira Road & Bhayandar','Bhayandar East'), ('Mira Road & Bhayandar','Bhayandar West'),
  ('Mira Road & Bhayandar','Navghar'), ('Mira Road & Bhayandar','Uttan'), ('Mira Road & Bhayandar','Dongri'),
  ('Vasai & Virar','Naigaon East'), ('Vasai & Virar','Naigaon West'), ('Vasai & Virar','Juchandra'),
  ('Vasai & Virar','Vasai Road East'), ('Vasai & Virar','Vasai Road West'), ('Vasai & Virar','Vasai Gaon'),
  ('Vasai & Virar','Papdy'), ('Vasai & Virar','Nalasopara East'), ('Vasai & Virar','Nalasopara West'),
  ('Vasai & Virar','Achole'), ('Vasai & Virar','Virar East'), ('Vasai & Virar','Virar West'),
  ('Vasai & Virar','Bolinj'), ('Vasai & Virar','Agashi'), ('Vasai & Virar','Arnala'),
  ('Palghar & Dahanu','Vaitarna'), ('Palghar & Dahanu','Saphale'), ('Palghar & Dahanu','Kelve Road'),
  ('Palghar & Dahanu','Palghar East'), ('Palghar & Dahanu','Palghar West'), ('Palghar & Dahanu','Umroli'),
  ('Palghar & Dahanu','Boisar East'), ('Palghar & Dahanu','Boisar West'), ('Palghar & Dahanu','Tarapur MIDC'),
  ('Palghar & Dahanu','Vangaon'), ('Palghar & Dahanu','Chinchani'), ('Palghar & Dahanu','Dahanu Road')
on conflict (name) do nothing;

insert into property_types (segment, name, slug) values
  ('residential','Flat / Apartment','flat'),
  ('residential','Independent House / Villa','villa'),
  ('residential','Row House','row-house'),
  ('residential','Residential Plot','residential-plot'),
  ('residential','Studio Apartment','studio'),
  ('commercial','Office Space','office'),
  ('commercial','Shop / Showroom','shop'),
  ('commercial','Warehouse / Godown','warehouse'),
  ('commercial','Industrial Shed','industrial-shed'),
  ('commercial','Commercial Plot','commercial-plot')
on conflict (slug) do nothing;
