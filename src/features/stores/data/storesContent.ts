export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  hours?: string;
  phone?: string;
  lat: number;
  lng: number;
};

/**
 * UAE retail locations from uae.swissarabian.com/pages/store-locator
 * (Stockist widget u15241). Lat/lng are the map pins on that page.
 */
export const STORE_LOCATIONS: StoreLocation[] = [
  {
    id: "abu-dhabi-mall",
    name: "Abu Dhabi Mall",
    address:
      "Unit 236824, First Floor, Ahmed Bin Hamad Al Hamed Street, Al Zahiyah, Abu Dhabi",
    phone: "+971 50 189 7796",
    lat: 24.4959241,
    lng: 54.3832259,
  },
  {
    id: "al-waha-center-rak",
    name: "Al Waha Center, Ras Al Khaimah",
    address: "Unit 146, Ground Floor, Al Waha Center, Sidrow, Ras Al Khaimah",
    phone: "+971 52 607 3835",
    lat: 25.7909581,
    lng: 55.9393197,
  },
  {
    id: "al-wahda-mall-kiosk",
    name: "Al Wahda Mall Kiosk",
    address:
      "Unit GFK12, Ground Floor, Al Wahda Mall, Hazza Bin Zayed the First St, Al Nahyan, Abu Dhabi",
    phone: "+971 52 607 3823",
    lat: 24.47436105,
    lng: 54.37529652,
  },
  {
    id: "al-ain-souk",
    name: "Al Ain Souk",
    address: "Shop 15 & 16, Zayed Bin Sultan Street, Al Ain",
    phone: "+971 52 607 3864",
    lat: 24.22111243,
    lng: 55.73379124,
  },
  {
    id: "auh-souk",
    name: "Abu Dhabi Souk",
    address: "Shop 4, Al Qitah Street, Abu Dhabi",
    phone: "+971 52 607 3814",
    lat: 24.48913997,
    lng: 54.35532933,
  },
  {
    id: "bank-street-sharjah",
    name: "Bank Street, Sharjah",
    address: "Shop 8–9, Al Sheikh Bati Building, Showaheen, Rolla, Sharjah",
    phone: "+971 52 607 3862",
    lat: 25.3588876,
    lng: 55.3893504,
  },
  {
    id: "bawabat-al-sharq-mall",
    name: "Bawabat Al Sharq Mall",
    address: "Unit RA155, Ground Floor, Bawabat Al Sharq Mall, Baniyas East, Abu Dhabi",
    phone: "+971 52 607 3844",
    lat: 24.312021,
    lng: 54.619881,
  },
  {
    id: "ibn-battuta-metrolink",
    name: "Ibn Battuta Metrolink",
    address:
      "Unit LG-04, Lower Ground, Ibn Battuta Metro Link, Sheikh Zayed Road, Dubai",
    phone: "+971 54 994 4819",
    lat: 25.0465504,
    lng: 55.1180112,
  },
  {
    id: "city-centre-shindagha-kiosk",
    name: "City Centre Shindagha Kiosk",
    address:
      "Unit TK13, Ground Floor, City Centre Shindagha, Al Ghubaiba Rd, Al Fahidi, Dubai",
    phone: "+971 52 607 3841",
    lat: 25.2639203,
    lng: 55.2863344,
  },
  {
    id: "city-centre-ajman-kiosk",
    name: "City Centre Ajman Kiosk",
    address:
      "Unit TK64, Ground Floor, City Centre Ajman, Al Ittihad St, Al Jerf 2, Ajman",
    phone: "+971 52 607 3856",
    lat: 25.4240937,
    lng: 55.4968391,
  },
  {
    id: "city-centre-deira-kiosk",
    name: "City Centre Deira Kiosk",
    address: "Unit TK28, Ground Floor, Deira City Centre, Port Saeed, Dubai",
    phone: "+971 56 417 5525",
    lat: 25.2522653,
    lng: 55.3320096,
  },
  {
    id: "city-centre-deira-showroom",
    name: "City Centre Deira Showroom",
    address: "Unit HL006B, Second Floor, Deira City Centre, Port Saeed, Dubai",
    phone: "+971 52 607 3852",
    lat: 25.2522653,
    lng: 55.3320096,
  },
  {
    id: "city-centre-sharjah",
    name: "City Centre Sharjah",
    address: "Unit U005, First Floor, City Centre Sharjah, Al Wahda St, Sharjah",
    phone: "+971 52 607 3861",
    lat: 25.3247264,
    lng: 55.3934462,
  },
  {
    id: "city-centre-zahia",
    name: "City Centre Zahia, Sharjah",
    address:
      "Unit A047A, First Floor, City Centre Zahia, Muwaileh Commercial, Al Zahia, Sharjah",
    phone: "+971 56 504 6348",
    lat: 25.2994125,
    lng: 55.45372,
  },
  {
    id: "dalma-mall",
    name: "Dalma Mall",
    address: "Unit GR027, Ground Floor, Dalma Mall, ICAD I, Abu Dhabi",
    phone: "+971 52 607 3821",
    lat: 24.285423,
    lng: 54.4868671,
  },
  {
    id: "damac-hills-kiosk",
    name: "Damac Hills Kiosk",
    address: "Unit DMK07B, Ground Floor, Damac Hills Mall, Al Hessa Street, Dubai",
    hours: "Mon–Sat 10:00 AM–10:00 PM · Sun 10:00 AM–12:00 AM",
    phone: "+971 54 998 4378",
    lat: 25.0171251,
    lng: 55.2473939,
  },
  {
    id: "madina-mall-dubai",
    name: "Madina Mall, Dubai",
    address: "Shop 1-45, First Floor, Madina Mall, Muhaisnah 4, Al Qusais, Dubai",
    phone: "+971 52 607 3850",
    lat: 25.2819926,
    lng: 55.3982776,
  },
  {
    id: "dubai-outlet-mall-kiosk",
    name: "Dubai Outlet Mall Kiosk",
    address: "Unit SG-169, Ground Floor, Dubai Outlet Mall, Al Ain–Dubai Rd",
    phone: "+971 54 996 1691",
    lat: 25.0697074,
    lng: 55.3993948,
  },
  {
    id: "dubai-outlet-mall-showroom",
    name: "Dubai Outlet Mall Showroom",
    address: "Unit F122, First Floor, Dubai Outlet Mall, Al Ain–Dubai Rd",
    phone: "+971 52 607 3831",
    lat: 25.0697074,
    lng: 55.3993948,
  },
  {
    id: "ibn-battuta-tunisia-kiosk",
    name: "Ibn Battuta Tunisia Court Kiosk",
    address:
      "Unit IBS-GF-TPS-01, Ground Floor, Tunisia Court, Ibn Battuta Mall, Sheikh Zayed Rd, Dubai",
    phone: "+971 52 906 4226",
    lat: 25.0429503,
    lng: 55.1183666,
  },
  {
    id: "khalidiya-showroom",
    name: "Khalidiya Showroom, Abu Dhabi",
    address: "Dara Tul Miyea Street, Khalidiya, Abu Dhabi",
    phone: "+971 52 607 3817",
    lat: 24.4881757,
    lng: 54.3549462,
  },
  {
    id: "khalidiya-mall",
    name: "Khalidiya Mall",
    address:
      "Unit 104, Ground Floor, Khalidiya Mall, Mubarak Bin Mohammed St, Al Khalidiyah, Abu Dhabi",
    phone: "+971 55 600 5306",
    lat: 24.46468466,
    lng: 54.35836779,
  },
  {
    id: "lulu-ajman",
    name: "Lulu Ajman",
    address: "Shop 19, Second Floor, Lulu Hypermarket, Masfout St, Ajman",
    phone: "+971 52 607 3868",
    lat: 25.4052165,
    lng: 55.5136433,
  },
  {
    id: "lulu-barsha",
    name: "Lulu Centre Barsha",
    address: "Kiosk 13-A, First Floor, Lulu Hypermarket, Umm Suqeim St, Al Barsha, Dubai",
    phone: "+971 52 607 3829",
    lat: 25.1171226,
    lng: 55.2071167,
  },
  {
    id: "lulu-deira",
    name: "Lulu Centre Deira",
    address: "Kiosk 1 & 2, Ground Floor, Lulu Hypermarket, Al Mateena St, Deira, Dubai",
    phone: "+971 52 607 3825",
    lat: 25.2788468,
    lng: 55.3309395,
  },
  {
    id: "lulu-dibba",
    name: "Lulu Centre Dibba",
    address: "Ground Floor, Lulu Hypermarket, Rugaylat Rd, Al Rashidiyah, Fujairah",
    phone: "+971 52 607 3869",
    lat: 25.5889121,
    lng: 56.2727209,
  },
  {
    id: "lulu-qusais",
    name: "Lulu Centre Qusais",
    address: "Shop 16, First Floor, Lulu Hypermarket, Al Nahda 1, Al Qusais, Dubai",
    phone: "+971 52 607 3846",
    lat: 25.2919567,
    lng: 55.365513,
  },
  {
    id: "lulu-fujairah",
    name: "Lulu Fujairah",
    address: "Unit F12, Ground Floor, Lulu Hypermarket, Al Khortabha Rd, Fujairah",
    phone: "+971 52 646 6908",
    lat: 25.1201596,
    lng: 56.3280636,
  },
  {
    id: "lulu-kuwaitat-al-ain",
    name: "Lulu Hypermarket Kuwaitat, Al Ain",
    address: "Ground Floor, Shakhboot Bin Sultan St, Central District, Al Ain",
    phone: "+971 52 646 6894",
    lat: 24.23411804,
    lng: 55.77503427,
  },
  {
    id: "madinat-zayed-kiosk",
    name: "Madinat Zayed Kiosk",
    address: "Unit 08-GK-35, Ground Floor, Madinat Zayed, Abu Dhabi",
    phone: "+971 52 607 3818",
    lat: 24.48502183,
    lng: 54.36618469,
  },
  {
    id: "mall-of-the-emirates-kiosk",
    name: "Mall of the Emirates Kiosk",
    address: "Unit TK30, Ground Floor, Mall of the Emirates, Sheikh Zayed Rd, Al Barsha, Dubai",
    phone: "+971 52 607 3830",
    lat: 25.118107,
    lng: 55.200608,
  },
  {
    id: "manar-mall-kiosk",
    name: "Manar Mall Kiosk",
    address:
      "Unit MM 108, Ground Floor, Manar Mall, Al Muntasir Rd, Dafan Al Nakheel, Ras Al Khaimah",
    phone: "+971 52 607 3859",
    lat: 25.7835861,
    lng: 55.9656124,
  },
  {
    id: "marina-mall-abu-dhabi",
    name: "Marina Mall, Abu Dhabi",
    address: "Unit GQ2, Ground Floor, Marina Mall, Ring Road, Abu Dhabi",
    phone: "+971 56 219 1763",
    lat: 24.4881757,
    lng: 54.3549462,
  },
  {
    id: "mazyad-mall-kiosk",
    name: "Mazyad Mall Kiosk",
    address:
      "Unit GFK-24, Ground Floor, Mazyad Mall, Mohamed Bin Zayed City, Musaffah, Abu Dhabi",
    phone: "+971 56 739 0863",
    lat: 24.371021,
    lng: 54.537044,
  },
  {
    id: "megamall-kiosk",
    name: "MegaMall Kiosk, Sharjah",
    address: "Unit GK 06, Ground Floor, MegaMall, Istiqlal Street, Sharjah",
    phone: "+971 52 607 3858",
    lat: 25.34518919,
    lng: 55.39726377,
  },
  {
    id: "mushrif-mall",
    name: "Mushrif Mall",
    address:
      "Unit S-14, Second Floor, Mushrif Mall, Sheikh Rashid Bin Saeed St, Abu Dhabi",
    phone: "+971 52 607 3824",
    lat: 24.44638295,
    lng: 54.39330909,
  },
  {
    id: "dubai-festival-city",
    name: "Dubai Festival City",
    address: "Unit AT 027, First Floor, Dubai Festival City Mall, Crescent Rd, Dubai",
    phone: "+971 52 607 3833",
    lat: 25.2187726,
    lng: 55.3637911,
  },
  {
    id: "oasis-mall-kiosk",
    name: "Oasis Mall Kiosk",
    address: "Shop 4, First Floor, Oasis Mall, Sheikh Zayed Road, Dubai",
    phone: "+971 52 607 3836",
    lat: 25.1698768,
    lng: 55.2413349,
  },
  {
    id: "radisson-blu-palm-kiosk",
    name: "Radisson Blu Palm Jumeirah Kiosk",
    address: "Ground Floor, Radisson Blu Hotel, Palm Jumeirah, Dubai",
    phone: "+971 50 710 6805",
    lat: 25.1124317,
    lng: 55.138978,
  },
  {
    id: "rak-mall-kiosk",
    name: "RAK Mall Kiosk",
    address: "Unit GFK05, Ground Floor, RAK Mall, Khuzam Rd, Al Qurum, Ras Al Khaimah",
    phone: "+971 52 607 3871",
    lat: 25.7721695,
    lng: 55.9585539,
  },
  {
    id: "reef-mall",
    name: "Reef Mall",
    address: "Second Floor, Reef Mall, Salah Al Din St, Deira, Dubai",
    phone: "+971 52 607 3847",
    lat: 25.2700782,
    lng: 55.3225863,
  },
  {
    id: "sahara-centre",
    name: "Sahara Centre",
    address: "Unit G6122A, Sahara Centre, Al Nahda 1, Sharjah",
    phone: "+971 52 607 3860",
    lat: 25.29920737,
    lng: 55.37622861,
  },
  {
    id: "silicon-central-kiosk",
    name: "Silicon Central Kiosk",
    address: "Unit GFK48, Ground Floor, Silicon Central, Dubai Silicon Oasis, Dubai",
    phone: "+971 52 906 4231",
    lat: 23.91486962,
    lng: 54.32685818,
  },
  {
    id: "yas-mall",
    name: "Yas Mall",
    address: "Unit LG-013, Lower Ground, Yas Mall, Al Athari St, Yas Island, Abu Dhabi",
    phone: "+971 50 530 2866",
    lat: 24.49012555,
    lng: 54.60671332,
  },
];

/** Default camera for UAE overview */
export const UAE_MAP_CENTER = { lat: 24.9, lng: 55.4 } as const;
export const UAE_MAP_ZOOM = 8;

export function nearestStore(
  lat: number,
  lng: number,
  stores: StoreLocation[] = STORE_LOCATIONS,
): StoreLocation | null {
  if (stores.length === 0) return null;
  let best = stores[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const store of stores) {
    const dlat = store.lat - lat;
    const dlng = store.lng - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < bestDist) {
      bestDist = dist;
      best = store;
    }
  }
  return best;
}
