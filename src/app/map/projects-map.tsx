"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Project } from "@/lib/repo";
import { formatMoney } from "@/lib/format";

interface Props {
  projects: Project[];
  selected: Project | null;
  onSelect: (p: Project) => void;
}

/** Радиус точки от объёма финансирования (лог-шкала) */
function radius(amount: number): number {
  return Math.max(7, Math.min(22, Math.log10(amount / 1e8) * 6));
}

export default function ProjectsMap({ projects, selected, onSelect }: Props) {
  return (
    <MapContainer
      center={[48.2, 68.5]}
      zoom={5}
      minZoom={4}
      style={{ height: 520, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {projects.map((p) => {
        const isSel = selected?.id === p.id;
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={radius(p.amount)}
            pathOptions={{
              color: isSel ? "#c9a227" : "#173d7a",
              weight: isSel ? 3 : 1.5,
              fillColor: isSel ? "#ddb95f" : "#2a63b8",
              fillOpacity: isSel ? 0.85 : 0.55,
            }}
            eventHandlers={{ click: () => onSelect(p) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#555" }}>
                {p.region} · {formatMoney(p.amount / 1e9)} млрд ₸
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
