export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone?: string;
  /** WGS84 coordinates for Google Maps markers */
  lat: number;
  lng: number;
};

/** Static UAE retail locations — replace with storefront API when available. */
export const STORE_LOCATIONS: StoreLocation[] = [
  {
    id: "dubai-festival-city",
    name: "Dubai Festival City",
    address: "Festival Centre, Dubai, UAE",
    hours: "Open until 10:00 PM · Sun–Thu",
    phone: "+971 4 232 8888",
    lat: 25.2219,
    lng: 55.3528,
  },
  {
    id: "deira-city-centre",
    name: "Deira City Centre",
    address: "City Centre Deira, Dubai, UAE",
    hours: "Open until 10:00 PM · Sun–Thu",
    phone: "+971 4 295 1010",
    lat: 25.2516,
    lng: 55.3332,
  },
  {
    id: "mall-of-the-emirates",
    name: "Mall of the Emirates",
    address: "Sheikh Zayed Road, Dubai, UAE",
    hours: "Open until 12:00 AM · Fri–Sat",
    phone: "+971 4 409 9000",
    lat: 25.1181,
    lng: 55.2006,
  },
  {
    id: "abu-dhabi-mall",
    name: "Abu Dhabi Mall",
    address: "Tourist Club Area, Abu Dhabi, UAE",
    hours: "Open until 10:00 PM · Sun–Thu",
    phone: "+971 2 645 4858",
    lat: 24.4955,
    lng: 54.3836,
  },
  {
    id: "sahara-centre",
    name: "Sahara Centre",
    address: "Al Nahda, Sharjah, UAE",
    hours: "Open until 11:00 PM · Sun–Thu",
    phone: "+971 6 531 3131",
    lat: 25.2972,
    lng: 55.3765,
  },
  {
    id: "al-naeem-mall",
    name: "Al Naeem Mall",
    address: "Al Naeem, Ras Al Khaimah, UAE",
    hours: "Open until 10:00 PM · Sun–Thu",
    phone: "+971 7 236 5555",
    lat: 25.7885,
    lng: 55.9682,
  },
];

/** Default camera for UAE overview */
export const UAE_MAP_CENTER = { lat: 25.2, lng: 55.3 } as const;
export const UAE_MAP_ZOOM = 8;
