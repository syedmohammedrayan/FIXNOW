require('dotenv').config();
const supabase = require('./config/supabase');

const STORE_ITEMS = [
  // --- POWER TOOLS ---
  {
    name: 'DeWalt 20V MAX Cordless Drill',
    description: 'Professional grade 20V cordless drill with 2 batteries and heavy-duty charger.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Makita 7-1/4" Circular Saw',
    description: 'High-torque circular saw with magnesium components for lightweight durability.',
    price: 159.00,
    image: 'https://images.unsplash.com/photo-1581147036324-c157f18db262?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- PLUMBING ---
  {
    name: 'Ridgid Heavy Duty Pipe Wrench',
    description: '18-inch straight pipe wrench with cast iron housing and I-beam handle.',
    price: 48.50,
    image: 'https://images.unsplash.com/photo-1586864387917-f729a5839eb0?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Professional Drain Auger (50ft)',
    description: 'Heavy duty manual/drill-powered snake for clearing mainline blockages.',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1621905252507-b354bc2d1d6c?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'PEX Crimp Tool Kit',
    description: 'Universal PEX crimping tool for 3/8", 1/2", 3/4" and 1" copper rings.',
    price: 110.00,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- ELECTRICAL ---
  {
    name: 'Fluke 117 Digital Multimeter',
    description: 'True-RMS multimeter for commercial electricians with VoltAlert technology.',
    price: 219.00,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Klein Tools Wire Stripper/Cutter',
    description: 'Precision ground stripping holes for 10-18 AWG solid wire.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Non-Contact Voltage Tester Pen',
    description: 'Dual-range detection (12-1000V AC) with visual and audible indicators.',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1516216628859-9bccecab13ca?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- HVAC ---
  {
    name: 'Yellow Jacket Manifold Gauge Set',
    description: 'Series 41 Deluxe for R-22, R-404A, and R-410A refrigerants.',
    price: 145.00,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Fieldpiece Vacuum Pump (8 CFM)',
    description: 'High-performance vacuum pump for rapid system evacuation.',
    price: 499.00,
    image: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- CARPENTRY ---
  {
    name: 'Swanson Speed Square',
    description: 'The original speed square with 1/4" notched spaced increments.',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Stanley Sweetheart Chisel Set',
    description: 'Premium 4-piece socket chisel set with hornbeam handles.',
    price: 189.00,
    image: 'https://images.unsplash.com/photo-1586864387917-f729a5839eb0?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- CLEANING ---
  {
    name: 'Karcher Professional Pressure Washer',
    description: 'G 3200 Q Gas Pressure Washer with 3200 PSI performance.',
    price: 349.00,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Industrial Wet/Dry Shop Vac',
    description: '16 Gallon, 6.5 Peak HP vacuum for heavy-duty jobsite cleanup.',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- PAINTING ---
  {
    name: 'Graco Ultra Cordless Airless Sprayer',
    description: 'Handheld airless sprayer for small to mid-size painting projects.',
    price: 549.00,
    image: 'https://images.unsplash.com/photo-1562254492-377a3ac576f4?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'Purdy 6-Piece Painter\'s Kit',
    description: 'Professional grade brushes and rollers for a flawless finish.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1589939705384-5185138a0470?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  // --- SAFETY & GEAR ---
  {
    name: 'Industrial Safety Hard Hat',
    description: 'Type 1 Class C hard hat with 6-point ratchet suspension.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1584285437873-195ff240c036?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  },
  {
    name: 'ToughBuilt Master Tool Belt Set',
    description: 'Modular tool belt with ClipTech pouches and padded suspenders.',
    price: 89.00,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    in_stock: true
  }
];

async function seedTools() {
  try {
    // Clear existing catalog
    const { data: existing } = await supabase.from('tool_catalog').select('id');
    if (existing && existing.length > 0) {
      const ids = existing.map(i => i.id);
      await supabase.from('tool_catalog').delete().in('id', ids);
      console.log('Cleared existing catalog.');
    }

    // Insert new items
    const { error } = await supabase.from('tool_catalog').insert(STORE_ITEMS);
    if (error) throw error;

    console.log(`Successfully seeded ${STORE_ITEMS.length} real-world tools into the catalog!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
}

seedTools();
