import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const C = {
  green: "#004C54",
  orange: "#D4691C",
};

const memberZips = [
  { zip: "19147", lat: 39.9526, lng: -75.1652 },
  { zip: "19711", lat: 39.8235, lng: -75.5847 },
  { zip: "19380", lat: 39.8900, lng: -75.3289 },
  { zip: "19072", lat: 39.8812, lng: -75.4950 },
  { zip: "19007", lat: 39.9389, lng: -75.5089 },
  { zip: "19067", lat: 39.8945, lng: -75.4512 },
  { zip: "19390", lat: 40.1245, lng: -75.4967 },
  { zip: "19335", lat: 39.8745, lng: -75.4189 },
  { zip: "19428", lat: 40.2134, lng: -75.3850 },
  { zip: "19810", lat: 39.7834, lng: -75.3945 },
  { zip: "19014", lat: 39.8134, lng: -75.3278 },
  { zip: "19038", lat: 40.0234, lng: -75.1456 },
  { town: "West Grove", lat: 39.8134, lng: -75.7856 },
  { town: "Kennett Square", lat: 39.8534, lng: -75.7234 },
];

const mapCourses = [
  { name: "Wyncote Golf Club", lat: 39.804, lng: -75.978 },
  { name: "Jeffersonville Golf Club", lat: 40.138, lng: -75.432 },
  { name: "Glen Mills Golf Course", lat: 39.893, lng: -75.497 },
  { name: "Broad Run Golfers Club", lat: 39.960, lng: -75.665 },
  { name: "Paxon Hollow CC", lat: 39.918, lng: -75.397 },
  { name: "Town & Country Golf Links", lat: 39.653, lng: -75.332 },
  { name: "Rock Manor Golf Club", lat: 39.756, lng: -75.573 },
  { name: "Makefield Highlands", lat: 40.228, lng: -74.887 },
];

export default function RegionMap() {
  return (
    <MapContainer
      center={[39.94, -75.43]}
      zoom={9}
      scrollWheelZoom={false}
      zoomControl={true}
      style={{ height: "400px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {memberZips.map((z, i) => (
        <CircleMarker
          key={i}
          center={[z.lat, z.lng]}
          radius={6}
          fillColor={C.green}
          fillOpacity={0.7}
          color="#fff"
          weight={1.5}
        />
      ))}
      {mapCourses.map((c, i) => (
        <CircleMarker
          key={i}
          center={[c.lat, c.lng]}
          radius={8}
          fillColor={C.orange}
          fillOpacity={0.85}
          color="#fff"
          weight={1.5}
        >
          <Tooltip direction="top" offset={[0, -6]}>{c.name}</Tooltip>
        </CircleMarker>
      ))}
      <CircleMarker
        center={[39.9526, -75.1652]}
        radius={10}
        fillColor={C.green}
        fillOpacity={0.95}
        color="#fff"
        weight={2}
      >
        <Tooltip permanent direction="right" offset={[8, 0]} opacity={1}>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px" }}>Philadelphia</span>
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
