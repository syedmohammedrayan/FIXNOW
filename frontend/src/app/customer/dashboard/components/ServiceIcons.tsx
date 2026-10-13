import React from 'react';

interface IconProps {
  className?: string;
}

// 1. All: Restrained services overview / category grid symbol
export function AllIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M6.5 6.5h.01M17.5 6.5h.01M6.5 17.5h.01M17.5 17.5h.01" />
    </svg>
  );
}

// 2. HVAC / AC Technician: Indoor split AC unit with airflow louvers
export function HvacIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="9" rx="2" />
      <path d="M6 9h12" />
      <path d="M19 7h.01" />
      <path d="M6 16c1-1 2-1 3 0s2 1 3 0" />
      <path d="M12 16c1-1 2-1 3 0s2 1 3 0" />
      <path d="M8 19c1-1 2-1 3 0s2 1 3 0" />
    </svg>
  );
}

// 3. Refrigerator Technician: Double-door refrigerator with top freezer & bottom fridge
export function RefrigeratorIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 9h14" />
      <path d="M9 5v2" />
      <path d="M9 12v4" />
      <path d="M7 22v1" />
      <path d="M17 22v1" />
    </svg>
  );
}

// 4. Washing Machine Technician: Front-load washing machine with porthole
export function WashingMachineIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2.5" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M12 11a2 2 0 0 1 2 2" />
      <path d="M8 5.5h2" />
      <circle cx="16" cy="5.5" r="1" fill="currentColor" />
    </svg>
  );
}

// 5. Kitchen Services Technician: Kitchen cooking hob / gas stove
export function KitchenServicesIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="7.5" cy="11.5" r="2.5" />
      <circle cx="16.5" cy="11.5" r="2.5" />
      <circle cx="7.5" cy="16.5" r=".75" fill="currentColor" />
      <circle cx="12" cy="16.5" r=".75" fill="currentColor" />
      <circle cx="16.5" cy="16.5" r=".75" fill="currentColor" />
      <path d="M7.5 9v1M16.5 9v1" />
    </svg>
  );
}

// 6. Water Systems Technician: Water purifier wall unit with dispenser tap
export function WaterSystemsIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2" width="14" height="17" rx="2.5" />
      <rect x="8" y="5" width="8" height="5" rx="1" />
      <path d="M12 15v3m0 0a1.5 1.5 0 0 1-1.5-1.5" />
      <path d="M12 21a1.2 1.2 0 0 0 1.2-1.2c0-.7-1.2-1.8-1.2-1.8s-1.2 1.1-1.2 1.8a1.2 1.2 0 0 0 1.2 1.2z" />
    </svg>
  );
}

// 7. Electrician: Electrical wall plug with prongs and cable
export function ElectricianIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 2v4M15 2v4" />
      <rect x="6" y="6" width="12" height="7" rx="2" />
      <path d="M12 13v4c0 2-2 3-4 3H7" />
    </svg>
  );
}

// 8. Electronics & Smart Home: Slim smart television / automation control panel
export function ElectronicsSmartHomeIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="12" rx="2" />
      <path d="M8 19h8M12 15v4" />
      <path d="M7 7h3M7 10h5" />
      <circle cx="16.5" cy="7.5" r="1.5" />
    </svg>
  );
}

// 9. Carpentry: Professional claw hammer & wood tool
export function CarpentryIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 4l5 5M18 2l4 4-2 2-4-4 2-2z" />
      <path d="M14 6L4 16c-.6.6-.6 1.4 0 2l2 2c.6.6 1.4.6 2 0L18 10" />
      <path d="M11 9l4 4" />
    </svg>
  );
}

// 10. Plumbing: Pipe wrench / plumbing pipe fitting
export function PlumbingIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 3h4v4h-2V5h-2V3z" />
      <path d="M16 5l-2.5 2.5a2 2 0 0 1-2.8 0L9.5 6.3a2 2 0 0 0-2.8 0L3 10l3 3 3.7-3.7a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 0 2.8 0L21 6" />
      <path d="M14 14l6 6c.6.6.6 1.4 0 2l-1 1c-.6.6-1.4.6-2 0l-6-6" />
    </svg>
  );
}

// 11. Gas & Utilities: Gas cylinder with valve collar & handles
export function GasUtilitiesIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="6" y="8" width="12" height="13" rx="3" />
      <path d="M9 5h6v3H9z" />
      <path d="M12 2v3" />
      <path d="M8 8V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 13h12" />
    </svg>
  );
}

// 12. Installation Services Technician: Cordless power drill
export function InstallationServicesIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 4h-4a2 2 0 0 0-2 2v2H3v2h5v1a2 2 0 0 0 2 2h4l4-4V6a2 2 0 0 0-2-2z" />
      <path d="M10 13v6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4" />
      <path d="M3 9H1" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

// 13. Pest Control: Pest control pressure sprayer tank with wand
export function PestControlIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="8" width="8" height="12" rx="2" />
      <path d="M7 5h4v3H7z" />
      <path d="M9 2v3" />
      <path d="M13 10h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v-9" />
      <path d="M19 7l1-2" />
    </svg>
  );
}

// 14. Cleaning Services: Vacuum cleaner / cleaning equipment
export function CleaningServicesIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 18a4 4 0 0 1 8 0v2H4v-2z" />
      <circle cx="8" cy="18" r="1.5" />
      <path d="M8 14V4a1 1 0 0 1 1-1h1" />
      <path d="M10 8h8a2 2 0 0 1 2 2v10" />
      <path d="M18 20h4" />
    </svg>
  );
}

// 15. Painter: Paint roller with frame and handle
export function PainterIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="14" height="6" rx="1.5" />
      <path d="M18 6h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7v4" />
      <rect x="11" y="18" width="2" height="4" rx=".5" fill="currentColor" />
    </svg>
  );
}

// 16. Renovation Service: Construction trowel / masonry tool
export function RenovationServiceIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l7 7-7 7-3-3 3-4-7-4 7-3z" />
      <path d="M12 16v3a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

// 17. Moving & Misc: Heavy-duty 2-wheel hand truck / trolley with cartons
export function MovingMiscIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3v15" />
      <path d="M6 18h11" />
      <circle cx="8" cy="19" r="2" />
      <circle cx="15" cy="19" r="2" />
      <rect x="9" y="8" width="8" height="8" rx="1" />
      <path d="M13 8v8" />
    </svg>
  );
}

// 18. Bike Mechanics: Motorcycle / two-wheeler
export function BikeMechanicsIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5.5" cy="16.5" r="3.5" />
      <circle cx="18.5" cy="16.5" r="3.5" />
      <path d="M9 16.5l3-6 4 6" />
      <path d="M12 10.5h4l2-4h2" />
      <path d="M8 10h4" />
    </svg>
  );
}

// 19. Car Mechanics: Car chassis with service wrench detail
export function CarMechanicsIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 14h18" />
      <path d="M5 14l1.5-5a2 2 0 0 1 1.9-1.4h7.2a2 2 0 0 1 1.9 1.4L19 14" />
      <circle cx="7" cy="15" r="2.5" />
      <circle cx="17" cy="15" r="2.5" />
      <path d="M10 4l2 2-1 1" />
    </svg>
  );
}

// 20. Rural Area Technicians: Heavy-duty field technician toolbox
export function RuralAreaTechniciansIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
      <path d="M3 13h18" />
      <path d="M9 12v2" />
      <path d="M15 12v2" />
    </svg>
  );
}

/**
 * Maps category name to its dedicated appliance/tool SVG icon
 */
export function getCategoryIcon(categoryName: string, className = "size-5 text-neutral-800 shrink-0") {
  switch (categoryName) {
    case 'All':
      return <AllIcon className={className} />;
    case 'HVAC / AC Technician':
      return <HvacIcon className={className} />;
    case 'Refrigerator Technician':
      return <RefrigeratorIcon className={className} />;
    case 'Washing Machine Technician':
      return <WashingMachineIcon className={className} />;
    case 'Kitchen Services Technician':
      return <KitchenServicesIcon className={className} />;
    case 'Water Systems Technician':
      return <WaterSystemsIcon className={className} />;
    case 'Electrician':
      return <ElectricianIcon className={className} />;
    case 'Electronics & Smart Home':
      return <ElectronicsSmartHomeIcon className={className} />;
    case 'Carpentry':
      return <CarpentryIcon className={className} />;
    case 'Plumbing':
      return <PlumbingIcon className={className} />;
    case 'Gas & Utilities':
      return <GasUtilitiesIcon className={className} />;
    case 'Installation Services Technician':
      return <InstallationServicesIcon className={className} />;
    case 'Pest Control':
      return <PestControlIcon className={className} />;
    case 'Cleaning Services':
      return <CleaningServicesIcon className={className} />;
    case 'Painter':
      return <PainterIcon className={className} />;
    case 'Renovation Service':
      return <RenovationServiceIcon className={className} />;
    case 'Moving & Misc':
      return <MovingMiscIcon className={className} />;
    case 'Bike Mechanics':
      return <BikeMechanicsIcon className={className} />;
    case 'Car Mechanics':
      return <CarMechanicsIcon className={className} />;
    case 'Rural Area Technicians':
      return <RuralAreaTechniciansIcon className={className} />;
    default:
      return <AllIcon className={className} />;
  }
}
