import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, RotateCcw, ExternalLink } from "lucide-react";
import citiesData from "../data/cities_clean.json";
import { getListingCoverImage } from "../api";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Single listing pin marker (Compact clean SVG location pin + price tag)
const createSingleMarker = (price, isHouse) => {
  const formattedPrice = price
    ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(price) + " ₺"
    : "";
  const color = isHouse ? "#059669" : "#2563eb";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
        transition: transform 0.15s ease;
      ">
        <svg width="20" height="26" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="11.5" r="4" fill="white"/>
        </svg>
        ${formattedPrice ? `
          <span style="
            background: rgba(15, 23, 42, 0.95);
            color: #ffffff;
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
            margin-top: 1px;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          ">${formattedPrice}</span>
        ` : ''}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -26],
  });
};

// Grouped City Marker (Compact SVG location pin with count number and 'adet' inside)
const createCityGroupMarker = (cityName, count, isHouse) => {
  const color = isHouse ? "#059669" : "#2563eb";

  return L.divIcon({
    className: "custom-leaflet-city-marker",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
        transition: transform 0.15s ease;
      ">
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <svg width="30" height="38" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
            <circle cx="12" cy="11.5" r="7.5" fill="white"/>
          </svg>
          <div style="
            position: absolute;
            top: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            user-select: none;
          ">
            <span style="
              font-size: 9.5px;
              font-weight: 900;
              color: ${color};
            ">${count > 99 ? '99+' : count}</span>
            <span style="
              font-size: 6px;
              font-weight: 800;
              color: ${color};
              letter-spacing: -0.2px;
              margin-top: 1px;
            ">adet</span>
          </div>
        </div>
        <span style="
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.8);
          margin-top: 1px;
          white-space: nowrap;
        ">${cityName}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -38],
  });
};

// Turkey center coordinates
const TURKEY_CENTER = [39.0, 35.3];
const DEFAULT_ZOOM = 6;

export default function ListingMap({
  listings = [],
  selectedCity = "",
  onCitySelect = null,
  listingType = "car", // "car" | "house"
  height = "520px",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeCity, setActiveCity] = useState(selectedCity || "");
  const [hoveredListing, setHoveredListing] = useState(null);

  // Synchronize internal activeCity if prop changes
  useEffect(() => {
    if (selectedCity !== activeCity) {
      setActiveCity(selectedCity);
      flyToCity(selectedCity);
    }
  }, [selectedCity]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: TURKEY_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
      });

      // Add Zoom control on top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Add modern OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create LayerGroup for listing markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Fly to City Handler
  const flyToCity = (cityName) => {
    if (!mapInstanceRef.current) return;

    if (!cityName) {
      mapInstanceRef.current.flyTo(TURKEY_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
      return;
    }

    const city = citiesData.find(
      (c) => c.name.toLocaleLowerCase("tr-TR") === cityName.toLocaleLowerCase("tr-TR")
    );

    if (city) {
      mapInstanceRef.current.flyTo([city.latitude, city.longitude], 11, {
        duration: 1.5,
      });
    }
  };

  // 3. User selects a city from dropdown
  const handleCityChange = (cityName) => {
    setActiveCity(cityName);
    flyToCity(cityName);
    if (onCitySelect) {
      onCitySelect(cityName);
    }
  };

  // 4. Reset to all Turkey view
  const handleResetView = () => {
    setActiveCity("");
    flyToCity("");
    if (onCitySelect) {
      onCitySelect("");
    }
  };

  // 5. Locate user's location via GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 13, { duration: 1.5 });
          // Add temporary pulsing current location marker
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: "#3b82f6",
            color: "#ffffff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup("📍 Mevcut Konumunuz")
            .openPopup();
        }
      },
      (error) => {
        alert("Konum alınamadı. Lütfen konum izni verdiğinizden emin olun.");
      }
    );
  };

  // 6. Update Markers when listings change (Group by city)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear previous markers
    markersLayerRef.current.clearLayers();

    // Map city names to coordinates
    const cityCoordsMap = new Map();
    citiesData.forEach((c) => {
      cityCoordsMap.set(c.name.toLocaleLowerCase("tr-TR"), [c.latitude, c.longitude]);
    });

    // Group listings by city/location
    const groups = new Map();

    listings.forEach((item) => {
      const cityName = (item.city || "Bilinmiyor").trim();
      const normalizedCity = cityName.toLocaleLowerCase("tr-TR");
      const lat = item.coordinates?.latitude ?? item.latitude;
      const lng = item.coordinates?.longitude ?? item.longitude;
      const coords =
        lat && lng
          ? [lat, lng]
          : cityCoordsMap.get(normalizedCity);

      if (coords) {
        if (!groups.has(normalizedCity)) {
          groups.set(normalizedCity, {
            cityName,
            coords,
            items: [],
          });
        }
        groups.get(normalizedCity).items.push(item);
      }
    });

    // Render grouped city markers
    groups.forEach(({ cityName, coords, items }) => {
      if (items.length === 1) {
        const item = items[0];
        const isHouse =
          listingType === "house" ||
          item.listing_type === "house" ||
          item.meter_squared !== undefined;

        const detailUrl = isHouse ? `/houses/${item.id}` : `/cars/${item.id}`;
        const coverImg = getListingCoverImage(item, isHouse ? "house" : "car");
        const formattedPrice = item.price
          ? new Intl.NumberFormat("tr-TR").format(item.price) + " ₺"
          : "Fiyat Belirtilmedi";

        const customIcon = createSingleMarker(item.price, isHouse);
        const marker = L.marker(coords, { icon: customIcon });

        const popupContent = `
          <div style="font-family: inherit; width: 220px; text-align: left; padding: 2px;">
            <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; background: #1e293b; margin-bottom: 8px;">
              <img src="${coverImg}" alt="${item.title || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/car-1.jpg'"/>
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${item.title || 'İlan Başlığı'}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #2563eb; margin-bottom: 4px;">
              ${formattedPrice}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              📍 ${item.city || ''} ${item.district ? '/ ' + item.district : ''}
            </div>
            <a href="${detailUrl}" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              background: #0f172a;
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              text-decoration: none;
            ">
              İlanı İncele
            </a>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 220 });
        markersLayerRef.current.addLayer(marker);
      } else {
        // Multiple listings in this city -> Group Marker
        const isHouse =
          listingType === "house" ||
          items.some(
            (i) => i.listing_type === "house" || i.meter_squared !== undefined
          );
        const customIcon = createCityGroupMarker(cityName, items.length, isHouse);
        const marker = L.marker(coords, { icon: customIcon });

        const itemsListHtml = items
          .map((item) => {
            const isHouse =
              item.listing_type === "house" || item.meter_squared !== undefined;
            const detailUrl = isHouse ? `/houses/${item.id}` : `/cars/${item.id}`;
            const coverImg = getListingCoverImage(item, isHouse ? "house" : "car");
            const formattedPrice = item.price
              ? new Intl.NumberFormat("tr-TR").format(item.price) + " ₺"
              : "Fiyat Belirtilmedi";

            return `
              <a href="${detailUrl}" style="
                display: flex;
                gap: 10px;
                padding: 8px;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                text-decoration: none;
                transition: all 0.2s;
                align-items: center;
              ">
                <img src="${coverImg}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0; background: #1e293b;" onerror="this.src='/car-1.jpg'"/>
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                    <span style="background: ${isHouse ? '#059669' : '#2563eb'}; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${isHouse ? 'Ev' : 'Araç'}</span>
                    <span style="font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.district || cityName}</span>
                  </div>
                  <div style="font-size: 11px; font-weight: 600; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px;">
                    ${item.title || 'İlan'}
                  </div>
                  <div style="font-size: 12px; font-weight: 800; color: #e8a33d;">
                    ${formattedPrice}
                  </div>
                </div>
              </a>
            `;
          })
          .join("");

        const dropdownPopupHtml = `
          <div style="font-family: inherit; width: 280px; max-height: 360px; display: flex; flex-direction: column; border-radius: 10px; overflow: hidden;">
            <div style="padding: 10px 12px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b;">
              <span style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span style="color: #e8a33d;">📍</span> ${cityName}
              </span>
              <span style="background: #e8a33d; color: #0f172a; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">
                ${items.length} İlan
              </span>
            </div>
            <div style="overflow-y: auto; max-height: 280px; padding: 8px; display: flex; flex-direction: column; gap: 8px; background: #182230;">
              ${itemsListHtml}
            </div>
          </div>
        `;

        marker.bindPopup(dropdownPopupHtml, { maxWidth: 320, minWidth: 280 });
        markersLayerRef.current.addLayer(marker);
      }
    });
  }, [listings, listingType]);

  return (
    <div
      className="relative w-full h-full min-h-[450px] overflow-hidden bg-[#0B1118]"
      style={{ height: height || "100%" }}
    >
      {/* 🧭 Top Overlay Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <select
            value={activeCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-2"
          >
            <option value="" className="text-slate-800 dark:text-slate-900">
              Tüm Türkiye ({citiesData.length} Şehir)
            </option>
            {citiesData.map((c) => (
              <option key={c.id} value={c.name} className="text-slate-800 dark:text-slate-900">
                {c.id.toString().padStart(2, "0")} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location & Reset Actions */}
        <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-2">
          <button
            type="button"
            onClick={handleLocateMe}
            title="Konumumu Bul"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
          >
            <Navigation className="w-4 h-4" />
          </button>
          {activeCity && (
            <button
              type="button"
              onClick={handleResetView}
              title="Haritayı Sıfırla"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Listings Count Badge */}
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-300 dark:border-slate-700">
          {listings.length} ilan
        </div>
      </div>

      {/* 🗺️ Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full absolute inset-0 z-0"
        style={{ width: "100%", height: "100%", minHeight: "450px" }}
      />
    </div>
  );
}
