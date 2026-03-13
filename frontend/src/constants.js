export const DATASET = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';

// Backend API base URL — set to your FastAPI server when running locally
// Set to empty string '' to use direct data.gov.sg fallback
export const API_BASE = 'http://localhost:8000';

// Amenity must-have threshold definitions
export const AMENITY_THRESHOLDS = {
  mrt:      { maxMins: 6,  label: '≤500m' },
  hawker:   { maxMins: 12, label: '≤1km' },
  school:   { maxMins: 12, label: '≤1km' },
  park:     { maxMins: 12, label: '≤1km' },
  mall:     { maxMins: 18, label: '≤1.5km' },
  hospital: { maxMins: 36, label: '≤3km' },
};

export const REGIONS = {
  north: ['WOODLANDS', 'SEMBAWANG', 'YISHUN', 'ANG MO KIO', 'BISHAN'],
  northeast: ['SENGKANG', 'PUNGGOL', 'HOUGANG', 'SERANGOON', 'BUANGKOK'],
  east: ['TAMPINES', 'BEDOK', 'PASIR RIS', 'GEYLANG', 'KALLANG/WHAMPOA'],
  west: ['JURONG WEST', 'JURONG EAST', 'BUKIT BATOK', 'CHOA CHU KANG', 'CLEMENTI', 'BUKIT PANJANG'],
  central: ['QUEENSTOWN', 'BUKIT MERAH', 'TOA PAYOH', 'CENTRAL AREA', 'MARINE PARADE'],
};
export const ALL_TOWNS = Object.values(REGIONS).flat();

export const COORDS = {
  'WOODLANDS': { lat: 1.4360, lng: 103.7862 }, 'SEMBAWANG': { lat: 1.4491, lng: 103.8198 },
  'YISHUN': { lat: 1.4304, lng: 103.8354 }, 'ANG MO KIO': { lat: 1.3691, lng: 103.8454 },
  'BISHAN': { lat: 1.3526, lng: 103.8352 }, 'SENGKANG': { lat: 1.3868, lng: 103.8914 },
  'PUNGGOL': { lat: 1.3984, lng: 103.9072 }, 'HOUGANG': { lat: 1.3612, lng: 103.8863 },
  'SERANGOON': { lat: 1.3554, lng: 103.8679 }, 'TAMPINES': { lat: 1.3496, lng: 103.9568 },
  'BEDOK': { lat: 1.3236, lng: 103.9273 }, 'PASIR RIS': { lat: 1.3721, lng: 103.9474 },
  'GEYLANG': { lat: 1.3202, lng: 103.8888 }, 'KALLANG/WHAMPOA': { lat: 1.3139, lng: 103.8626 },
  'JURONG WEST': { lat: 1.3404, lng: 103.7090 }, 'JURONG EAST': { lat: 1.3329, lng: 103.7436 },
  'BUKIT BATOK': { lat: 1.3590, lng: 103.7637 }, 'CHOA CHU KANG': { lat: 1.3840, lng: 103.7470 },
  'CLEMENTI': { lat: 1.3162, lng: 103.7649 }, 'BUKIT PANJANG': { lat: 1.3774, lng: 103.7719 },
  'QUEENSTOWN': { lat: 1.2942, lng: 103.8060 }, 'BUKIT MERAH': { lat: 1.2819, lng: 103.8239 },
  'TOA PAYOH': { lat: 1.3343, lng: 103.8563 }, 'CENTRAL AREA': { lat: 1.2800, lng: 103.8509 },
  'MARINE PARADE': { lat: 1.3025, lng: 103.9067 }, 'BUANGKOK': { lat: 1.3827, lng: 103.8919 },
};

export const AMENITIES = {
  'WOODLANDS': { mrt: 'Woodlands MRT', mrtMin: 8, hawker: 'Woodlands Ctr Food', park: 'Woodlands Waterfront' },
  'SEMBAWANG': { mrt: 'Canberra MRT', mrtMin: 10, hawker: 'Sembawang Hills FC', park: 'Sembawang Park' },
  'YISHUN': { mrt: 'Yishun MRT', mrtMin: 6, hawker: 'Yishun Park Hawker', park: 'Lower Seletar Reservoir' },
  'ANG MO KIO': { mrt: 'Ang Mo Kio MRT', mrtMin: 7, hawker: 'AMK 628 Hawker', park: 'Bishan-AMK Park' },
  'BISHAN': { mrt: 'Bishan MRT', mrtMin: 8, hawker: 'Bishan North FC', park: 'Bishan-AMK Park' },
  'SENGKANG': { mrt: 'Sengkang MRT', mrtMin: 5, hawker: 'Kopitiam Compassvale', park: 'Sengkang Riverside' },
  'PUNGGOL': { mrt: 'Punggol MRT', mrtMin: 9, hawker: 'Punggol Plaza FC', park: 'Punggol Waterway' },
  'HOUGANG': { mrt: 'Hougang MRT', mrtMin: 7, hawker: 'Hougang Hainanese Village', park: 'Serangoon Reservoir' },
  'SERANGOON': { mrt: 'Serangoon MRT', mrtMin: 6, hawker: 'Chomp Chomp FC', park: 'Serangoon Park' },
  'TAMPINES': { mrt: 'Tampines MRT', mrtMin: 5, hawker: 'Tampines Round Mkt', park: 'Bedok Reservoir' },
  'BEDOK': { mrt: 'Bedok MRT', mrtMin: 7, hawker: 'Bedok Interchange FC', park: 'East Coast Park' },
  'PASIR RIS': { mrt: 'Pasir Ris MRT', mrtMin: 8, hawker: 'Pasir Ris FC', park: 'Pasir Ris Park' },
  'GEYLANG': { mrt: 'Aljunied MRT', mrtMin: 6, hawker: 'Geylang Serai Market', park: 'Geylang River Park' },
  'KALLANG/WHAMPOA': { mrt: 'Boon Keng MRT', mrtMin: 7, hawker: 'Whampoa Food Ctr', park: 'Kallang Riverside' },
  'JURONG WEST': { mrt: 'Boon Lay MRT', mrtMin: 8, hawker: 'Jurong West FC', park: 'Jurong Lake Gardens' },
  'JURONG EAST': { mrt: 'Jurong East MRT', mrtMin: 5, hawker: 'Taman Jurong FC', park: 'Jurong Lake Gardens' },
  'BUKIT BATOK': { mrt: 'Bukit Batok MRT', mrtMin: 7, hawker: 'Bukit Batok West FC', park: 'Bukit Batok Nature Pk' },
  'CHOA CHU KANG': { mrt: 'Choa Chu Kang MRT', mrtMin: 6, hawker: 'Teck Whye FC', park: 'Choa Chu Kang Pk' },
  'CLEMENTI': { mrt: 'Clementi MRT', mrtMin: 5, hawker: 'Clementi 448 FC', park: 'West Coast Park' },
  'BUKIT PANJANG': { mrt: 'Bukit Panjang MRT', mrtMin: 8, hawker: 'Bukit Panjang FC', park: 'Dairy Farm Nature Pk' },
  'QUEENSTOWN': { mrt: 'Queenstown MRT', mrtMin: 6, hawker: 'Mei Chin Food Ctr', park: 'Queenstown Stadium Pk' },
  'BUKIT MERAH': { mrt: 'Redhill MRT', mrtMin: 7, hawker: 'Redhill Food Ctr', park: 'Telok Blangah Hill' },
  'TOA PAYOH': { mrt: 'Toa Payoh MRT', mrtMin: 5, hawker: 'Toa Payoh Food Ctr', park: 'Toa Payoh Town Pk' },
  'CENTRAL AREA': { mrt: 'City Hall MRT', mrtMin: 4, hawker: 'Maxwell Food Ctr', park: 'Fort Canning Park' },
  'MARINE PARADE': { mrt: 'Marine Parade MRT', mrtMin: 6, hawker: 'Marine Parade FC', park: 'East Coast Park' },
  'BUANGKOK': { mrt: 'Buangkok MRT', mrtMin: 5, hawker: 'Buangkok Square FC', park: 'Sengkang Riverside' },
};
