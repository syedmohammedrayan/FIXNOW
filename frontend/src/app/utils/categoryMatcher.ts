export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'HVAC / AC Technician': ['split ac', 'window ac', 'portable ac', 'tower ac', 'cassette ac', 'central ac',
                           'vrf', 'vrv', 'inverter ac', 'non-inverter ac', 'ac install', 'ac uninstall',
                           'ac shift', 'ac service', 'ac deep clean', 'ac jet clean', 'gas charg',
                           'leak detect', 'compressor', 'condenser', 'evaporator', 'coil clean',
                           'pcb repair', 'sensor', 'thermostat', 'blower', 'duct', 'hvac', 'ventilation'],
  'Refrigerator Technician': ['refrigerat', 'fridge', 'freezer', 'deep freezer', 'mini fridge',
                              'single door fridge', 'double door fridge', 'triple door fridge',
                              'side-by-side fridge', 'french door fridge', 'commercial freezer',
                              'defrost', 'ice maker', 'refrigerant', 'fridge compressor', 
                              'fridge condenser', 'fridge evaporator', 'fridge thermostat'],
  'Washing Machine Technician': ['washing machine', 'front load', 'top load', 'semi-automatic', 
                                 'fully automatic', 'washer dryer', 'drum', 'bearing', 'washing motor', 
                                 'washing pump', 'wm pcb', 'inlet valve', 'outlet valve', 'suspension'],
  'Kitchen Services Technician': ['microwave', 'convection', 'grill microwave', 'otg', 
                                  'chimney', 'hob', 'gas hob', 'gas stove', 'induction', 'cooktop', 
                                  'cooking range', 'dishwasher'],
  'Water Systems Technician': ['ro ', 'ro install', 'ro service', 'ro filter', 'uv purifier',
                               'uf purifier', 'water filter', 'water softener', 'water pump',
                               'booster pump', 'pressure pump', 'submersible', 'borewell',
                               'pipeline', 'pipe fitting', 'water tank', 'drain line'],
  'Electrician': ['electr', 'wiring', 'rewiring', 'switchboard', 'mcb', 'db panel',
                  'fan', 'ceiling fan', 'exhaust fan', 'light install', 'led',
                  'inverter', 'ups', 'battery', 'power supply', 'voltage stabilizer',
                  'earthing', 'load balanc'],
  'Plumbing': ['plumb', 'tap repair', 'faucet', 'shower', 'flush tank', 'toilet',
               'pipe install', 'pipe repair', 'drain clean', 'blockage', 'sewage',
               'bathroom fitting', 'kitchen plumbing', 'leakage', 'leak repair'],
  'Carpentry': ['carpent', 'furniture', 'bed assembly', 'sofa repair', 'table',
                'chair', 'door repair', 'door install', 'hinge', 'lock install',
                'digital lock', 'modular kitchen', 'cabinet', 'wardrobe', 'drawer',
                'curtain rod', 'blinds', 'sliding door', 'window fitting', 'wood'],
  'Cleaning Services': ['clean', 'deep clean', 'sanitiz', 'disinfect', 'floor polish',
                        'marble polish', 'tile clean', 'sofa clean', 'carpet clean',
                        'mattress clean', 'curtain clean', 'move-in clean', 'move-out clean',
                        'office clean', 'window clean', 'glass clean', 'balcony clean',
                        'housekeep', 'house keeping', 'maid'],
  'Painter': ['paint', 'texture', 'wall design', 'spray paint', 'waterproof',
              'wall putty', 'wall polish'],
  'Renovation Service': ['wallpaper', 'wall panel', 'false ceiling', 'pop', 'glass repair',
                         'aluminium', 'grill install', 'gate repair', 'door polish', 'furniture polish'],
  'Pest Control': ['pest', 'cockroach', 'termite', 'bed bug', 'mosquito', 'rodent',
                   'ant control', 'fumigat', 'herbal pest'],
  'Electronics & Smart Home': ['tv install', 'led tv', 'lcd tv', 'smart tv', 'tv repair',
                               'wall mount', 'cctv', 'dvr', 'nvr', 'set-top box', 'home theater',
                               'speaker', 'smart home', 'video doorbell', 'automation', 'iot',
                               'solar panel', 'ev charger'],
  'Gas & Utilities': ['gas pipeline', 'lpg', 'png', 'gas leak', 'fire extinguisher',
                      'fire safety', 'smoke detector'],
  'Moving & Misc': ['packers', 'movers', 'loading', 'unloading', 'home shift', 'driver', 'helper'],
  'Bike Mechanics': ['bike service', 'scooter', 'motorcycle', 'engine oil', 'brake repair', 'clutch', 'puncture'],
  'Car Mechanics': ['car service', 'wheel align', 'car ac', 'engine diag', 'car wash', 'detailing'],
  'Installation Services Technician': ['appliance install', 'appliance shift', 'wall drill', 'mounting', 'heavy equipment'],
  'Rural Area Technicians': ['rural', 'transformer', 'solar pump', 'handpump', 'borewell', 'sanitation', 'microgrid']
};

export const matchCategory = (text: string): string => {
  const lowerText = (text || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'General';
};

/**
 * Robust category matching for technician assignments.
 * Checks if the technician's primary category or any of their skills 
 * matches the request category.
 */
export const isCategoryMatch = (techCategory: string, requestCategory: string): boolean => {
  if (!techCategory || !requestCategory) return false;
  
  const tech = techCategory.toLowerCase().trim();
  const req = requestCategory.toLowerCase().trim();
  
  // 1. Exact match
  if (tech === req) return true;
  
  // 2. "General" fallback
  if (tech === 'general' || req === 'general') return true;
  
  // 3. Partial match (e.g. "AC Technician" matches "HVAC / AC Technician")
  if (tech.includes(req) || req.includes(tech)) return true;
  
  return false;
};
