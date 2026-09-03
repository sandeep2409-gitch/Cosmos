/**
 * Centralized Configuration & Metadata for Solar System Objects
 * Includes Visual Adjusted Scale and Real Astronomical AU Scale.
 */

export const SUN_CONFIG = {
  id: 'sun',
  name: 'Sun',
  type: 'Yellow Dwarf Star',
  radius: 14,             // Visual adjusted radius
  realRadius: 218.0,      // True astronomical relative radius (109x Earth)
  color: 0xffaa00,
  emissive: 0xffaa00,
  emissiveIntensity: 1.2,
  glowColor: 0xff6600,
  description: 'The star at the center of the Solar System. It is a nearly perfect ball of hot plasma, heating the planets and driving Earth\'s weather and climate.',
  positionFromSun: 'Center of Solar System',
  diameter: '1,392,700 km (109x Earth)',
  distanceFromSun: '0 km',
  orbitalPeriod: 'N/A (Galactic Orbit ~230M yrs)',
  rotationPeriod: '27 days',
  moonsCount: '8 Planets, 200+ Moons'
};

export const PLANETS_DATA = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    radius: 1.2,          // Visual adjusted radius
    realRadius: 0.76,     // True relative radius (0.38x Earth)
    distance: 28,         // Visual adjusted distance
    realDistance: 39,     // True astronomical distance (0.39 AU)
    orbitSpeed: 0.8,
    rotationSpeed: 0.005,
    axialTilt: 0.03,
    color: 0xa8a5a0,
    textureType: 'mercury',
    orbitColor: 0x4a5568,
    description: 'The smallest planet in the Solar System and closest to the Sun. Its surface is heavily cratered and experiences extreme temperature fluctuations.',
    positionFromSun: '1st Planet from Sun',
    diameter: '4,879 km (0.38x Earth)',
    distanceFromSun: '57.9 million km (0.39 AU)',
    orbitalPeriod: '88 days',
    rotationPeriod: '59 days',
    moonsCount: '0'
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    radius: 2.2,
    realRadius: 1.90,     // 0.95x Earth
    distance: 42,
    realDistance: 72,     // 0.72 AU
    orbitSpeed: 0.6,
    rotationSpeed: -0.003,
    axialTilt: 177.3,
    color: 0xe3bb76,
    textureType: 'venus',
    orbitColor: 0x5a6578,
    description: 'Spinning in the opposite direction to most planets, Venus has a runaway greenhouse effect making it the hottest planet in the Solar System.',
    positionFromSun: '2nd Planet from Sun',
    diameter: '12,104 km (0.95x Earth)',
    distanceFromSun: '108.2 million km (0.72 AU)',
    orbitalPeriod: '225 days',
    rotationPeriod: '243 days (Retrograde)',
    moonsCount: '0'
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial Planet',
    radius: 2.5,
    realRadius: 2.00,     // 1.00x Earth baseline
    distance: 60,
    realDistance: 100,    // 1.00 AU baseline
    orbitSpeed: 0.45,
    rotationSpeed: 0.01,
    axialTilt: 23.44,
    color: 0x2b82c5,
    textureType: 'earth',
    hasAtmosphere: true,
    atmosphereColor: 0x38bdf8,
    orbitColor: 0x3b82f6,
    description: 'The third planet from the Sun and the only astronomical object known to harbor life. Liquid water oceans cover 71% of its surface.',
    positionFromSun: '3rd Planet from Sun',
    diameter: '12,742 km (1.00x Earth)',
    distanceFromSun: '149.6 million km (1.00 AU)',
    orbitalPeriod: '365.25 days',
    rotationPeriod: '24 hours',
    moonsCount: '1 (The Moon)'
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet',
    radius: 1.6,
    realRadius: 1.06,     // 0.53x Earth
    distance: 78,
    realDistance: 152,    // 1.52 AU
    orbitSpeed: 0.35,
    rotationSpeed: 0.009,
    axialTilt: 25.19,
    color: 0xc1440e,
    textureType: 'mars',
    orbitColor: 0x64748b,
    description: 'Often called the "Red Planet" due to iron oxide rust on its surface. Mars features Olympus Mons, the largest volcano in the Solar System.',
    positionFromSun: '4th Planet from Sun',
    diameter: '6,779 km (0.53x Earth)',
    distanceFromSun: '227.9 million km (1.52 AU)',
    orbitalPeriod: '687 days',
    rotationPeriod: '24.6 hours',
    moonsCount: '2 (Phobos & Deimos)'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    radius: 7.2,
    realRadius: 22.42,    // 11.21x Earth
    distance: 108,
    realDistance: 520,    // 5.20 AU
    orbitSpeed: 0.22,
    rotationSpeed: 0.025,
    axialTilt: 3.13,
    color: 0xb07f35,
    textureType: 'jupiter',
    orbitColor: 0x475569,
    description: 'The largest planet in the Solar System. Jupiter is a gas giant with iconic atmospheric bands and the Great Red Spot, a storm larger than Earth.',
    positionFromSun: '5th Planet from Sun',
    diameter: '139,820 km (11.21x Earth)',
    distanceFromSun: '778.5 million km (5.20 AU)',
    orbitalPeriod: '11.86 years',
    rotationPeriod: '9.9 hours',
    moonsCount: '95 known moons'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    radius: 5.8,
    realRadius: 18.90,    // 9.45x Earth
    distance: 148,
    realDistance: 954,    // 9.54 AU
    orbitSpeed: 0.15,
    rotationSpeed: 0.022,
    axialTilt: 26.73,
    color: 0xe2bf7d,
    textureType: 'saturn',
    hasRings: true,
    ringConfig: {
      innerRadius: 7.5,
      outerRadius: 13.5,
      realInnerRadius: 23.0,
      realOuterRadius: 42.0,
      color: 0xd4b886,
      textureType: 'saturnRings'
    },
    orbitColor: 0x475569,
    description: 'Renowned for its spectacular, complex ring system composed of billions of chunks of ice and rock particles.',
    positionFromSun: '6th Planet from Sun',
    diameter: '116,460 km (9.45x Earth)',
    distanceFromSun: '1.43 billion km (9.54 AU)',
    orbitalPeriod: '29.45 years',
    rotationPeriod: '10.7 hours',
    moonsCount: '146 known moons'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    radius: 3.8,
    realRadius: 8.02,     // 4.01x Earth
    distance: 185,
    realDistance: 1919,   // 19.19 AU
    orbitSpeed: 0.1,
    rotationSpeed: -0.015,
    axialTilt: 97.77,
    color: 0x4b70dd,
    textureType: 'uranus',
    hasRings: true,
    ringConfig: {
      innerRadius: 4.8,
      outerRadius: 6.8,
      realInnerRadius: 10.0,
      realOuterRadius: 14.0,
      color: 0x76a0d0,
      textureType: 'uranusRings'
    },
    orbitColor: 0x334155,
    description: 'An ice giant with a unique sideways rotation, tilted nearly 98 degrees on its axis. It has a pale cyan atmosphere rich in methane ice.',
    positionFromSun: '7th Planet from Sun',
    diameter: '50,724 km (4.01x Earth)',
    distanceFromSun: '2.87 billion km (19.19 AU)',
    orbitalPeriod: '84 years',
    rotationPeriod: '17.2 hours',
    moonsCount: '28 known moons'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    radius: 3.6,
    realRadius: 7.76,     // 3.88x Earth
    distance: 220,
    realDistance: 3007,   // 30.07 AU
    orbitSpeed: 0.07,
    rotationSpeed: 0.016,
    axialTilt: 28.32,
    color: 0x274687,
    textureType: 'neptune',
    orbitColor: 0x334155,
    description: 'The outermost major planet in the Solar System. Neptune is a deep azure blue ice giant with supersonic winds reaching over 2,000 km/h.',
    positionFromSun: '8th Planet from Sun',
    diameter: '49,244 km (3.88x Earth)',
    distanceFromSun: '4.50 billion km (30.07 AU)',
    orbitalPeriod: '164.8 years',
    rotationPeriod: '16.1 hours',
    moonsCount: '16 known moons'
  }
];
