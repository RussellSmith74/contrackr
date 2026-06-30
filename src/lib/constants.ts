export const SERVICE_CATEGORIES = [
  // General
  { id: "general", label: "General", icon: "💬", description: "Open conversation, questions, tips" },
  // Construction & Structural
  { id: "general-contractor", label: "General Contractor", icon: "🏗️", description: "Full-service construction" },
  { id: "construction", label: "Construction", icon: "🧱", description: "New builds, additions, remodels" },
  { id: "roofing", label: "Roofing", icon: "🏠", description: "Roof repair, replacement, inspection" },
  { id: "concrete-flatwork", label: "Concrete & Flatwork", icon: "🪨", description: "Driveways, slabs, sidewalks" },
  { id: "masonry-stonework", label: "Masonry & Stonework", icon: "🧱", description: "Brick, block, stone work" },
  { id: "framing", label: "Framing", icon: "🪚", description: "Wood and metal framing" },
  { id: "insulation", label: "Insulation", icon: "🌡️", description: "Spray foam, batting, blown-in" },
  { id: "drywall-plastering", label: "Drywall & Plastering", icon: "🪣", description: "Sheetrock, texture, patch work" },
  // Interior
  { id: "flooring", label: "Flooring", icon: "🪵", description: "Hardwood, tile, LVP, carpet" },
  { id: "painting", label: "Painting", icon: "🎨", description: "Interior and exterior painting" },
  { id: "carpentry-woodwork", label: "Carpentry & Woodwork", icon: "🪚", description: "Trim, cabinets, custom builds" },
  { id: "window-door", label: "Window & Door Install", icon: "🚪", description: "Installation and replacement" },
  { id: "tile-work", label: "Tile Work", icon: "🔲", description: "Bathroom, kitchen, backsplash tile" },
  { id: "kitchen-bath-remodel", label: "Kitchen & Bath Remodel", icon: "🛁", description: "Full remodel, fixture upgrades" },
  // MEP
  { id: "plumbing", label: "Plumbing", icon: "🔧", description: "Pipes, drains, water heaters" },
  { id: "electrical", label: "Electrical", icon: "⚡", description: "Wiring, panels, outlets" },
  { id: "hvac", label: "HVAC", icon: "❄️", description: "Heating, cooling, air quality" },
  { id: "solar-generators", label: "Solar & Generators", icon: "☀️", description: "Solar panels, backup generators" },
  { id: "security-cameras", label: "Security Systems & Cameras", icon: "📷", description: "Alarm systems, CCTV, access control" },
  { id: "septic-drain", label: "Septic & Drain Field", icon: "🚰", description: "Septic install, pumping, drain field" },
  // Exterior & Property
  { id: "landscaping", label: "Landscaping", icon: "🌿", description: "Lawn care, mowing, landscaping design" },
  { id: "land-clearing", label: "Land Clearing", icon: "🌲", description: "Tree removal, brush clearing" },
  { id: "fencing", label: "Fencing", icon: "🪵", description: "Fence installation and repair" },
  { id: "irrigation-sprinklers", label: "Irrigation & Sprinklers", icon: "💦", description: "Sprinkler systems, drip lines" },
  { id: "pool-spa", label: "Pool & Spa Services", icon: "🏊", description: "Pool install, repair, cleaning" },
  { id: "pressure-washing", label: "Pressure Washing", icon: "💧", description: "Driveways, siding, decks" },
  { id: "pest-control", label: "Pest Control", icon: "🐛", description: "Extermination, prevention" },
  // Automotive & Equipment
  { id: "mobile-mechanic", label: "Mobile Mechanic", icon: "🚗", description: "On-site vehicle repair" },
  { id: "auto-detailing", label: "Auto Detailing", icon: "✨", description: "Interior and exterior detailing" },
  { id: "towing", label: "Towing", icon: "🚐", description: "Vehicle towing and roadside" },
  { id: "equipment-operator", label: "Equipment Operator", icon: "🚜", description: "Excavator, dozer, skid steer" },
  // Hauling & Logistics
  { id: "hauling-junk-removal", label: "Hauling & Junk Removal", icon: "🚛", description: "Debris removal, hauling" },
  { id: "trucking-hauling", label: "Trucking & Heavy Hauling", icon: "🛻", description: "Heavy loads, flatbed, freight" },
  { id: "moving-labor", label: "Moving & Labor Help", icon: "📦", description: "Moving help, heavy lifting, loading" },
  // Trades
  { id: "welding-fabrication", label: "Welding & Fabrication", icon: "🔥", description: "Metal work, custom fabrication" },
  { id: "cleaning", label: "Cleaning Services", icon: "🧹", description: "Residential and commercial cleaning" },
  { id: "handyman", label: "Handyman Services", icon: "🛠️", description: "Odd jobs, repairs, maintenance" },
] as const;

export type CategoryId = typeof SERVICE_CATEGORIES[number]["id"];

export const JOB_STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const BID_STATUSES = ["pending", "accepted", "declined", "withdrawn"] as const;
export type BidStatus = typeof BID_STATUSES[number];

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within a week",
  "Within 2 weeks",
  "Within a month",
  "Flexible",
] as const;

export const BUDGET_RANGES = [
  "Under $500",
  "$500 – $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000+",
  "Open to bids",
] as const;
