export const SERVICE_CATEGORIES = [
  { id: "landscaping", label: "Landscaping", icon: "🌿", description: "Lawn care, mowing, landscaping design" },
  { id: "roofing", label: "Roofing", icon: "🏠", description: "Roof repair, replacement, inspection" },
  { id: "plumbing", label: "Plumbing", icon: "🔧", description: "Pipes, drains, water heaters" },
  { id: "hvac", label: "HVAC", icon: "❄️", description: "Heating, cooling, air quality" },
  { id: "electrical", label: "Electrical", icon: "⚡", description: "Wiring, panels, outlets" },
  { id: "land-clearing", label: "Land Clearing", icon: "🌲", description: "Tree removal, brush clearing" },
  { id: "pest-control", label: "Pest Control", icon: "🐛", description: "Extermination, prevention" },
  { id: "general-contractor", label: "General Contractor", icon: "🏗️", description: "Full-service construction" },
  { id: "construction", label: "Construction", icon: "🧱", description: "New builds, additions, remodels" },
  { id: "pressure-washing", label: "Pressure Washing", icon: "💧", description: "Driveways, siding, decks" },
  { id: "painting", label: "Painting", icon: "🎨", description: "Interior and exterior painting" },
  { id: "fencing", label: "Fencing", icon: "🪵", description: "Fence installation and repair" },
  { id: "mobile-mechanic", label: "Mobile Mechanic", icon: "🚗", description: "On-site vehicle repair" },
  { id: "auto-detailing", label: "Auto Detailing", icon: "✨", description: "Interior and exterior detailing" },
  { id: "hauling-junk-removal", label: "Hauling & Junk Removal", icon: "🚛", description: "Debris removal, hauling" },
  { id: "welding-fabrication", label: "Welding & Fabrication", icon: "🔥", description: "Metal work, custom fabrication" },
  { id: "cleaning", label: "Cleaning Services", icon: "🧹", description: "Residential and commercial cleaning" },
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
