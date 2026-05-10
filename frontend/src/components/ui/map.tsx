"use client";

import MapLibreGL, { type PopupOptions, type MarkerOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// --- Types ---
type MapContextType = {
  map: MapLibreGL.Map | null;
  mapContainer: HTMLDivElement | null;
};

type MapProps = {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onLoad?: (map: MapLibreGL.Map) => void;
  children?: ReactNode;
  styles?: {
    light?: string;
    dark?: string;
  };
};

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  options?: MarkerOptions;
  onClick?: (e: MapLibreGL.Marker) => void;
  children?: ReactNode;
};

type MapPopupProps = {
  longitude: number;
  latitude: number;
  options?: PopupOptions;
  children?: ReactNode;
};

type MapRouteProps = {
  coordinates: [number, number][];
  id?: string;
  color?: string;
  width?: number;
  opacity?: number;
  animate?: boolean;
};

type MapControlsProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showLocate?: boolean;
  className?: string;
};

// --- Context ---
const MapContext = createContext<MapContextType>({
  map: null,
  mapContainer: null,
});

// --- Constants ---
const DEFAULT_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

// --- Components ---
export function Map({
  center = [0, 0],
  zoom = 1,
  className = "w-full h-full",
  onLoad,
  children,
  styles = DEFAULT_STYLES,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreGL.Map | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentStyle = useMemo(() => {
    const activeTheme = resolvedTheme || theme || "light";
    return activeTheme === "dark" ? styles.dark : styles.light;
  }, [resolvedTheme, theme, styles]);

  useEffect(() => {
    if (!containerRef.current || !isMounted) return;

    const mapInstance = new MapLibreGL.Map({
      container: containerRef.current,
      style: currentStyle || DEFAULT_STYLES.light,
      center,
      zoom,
    });

    mapInstance.on("load", () => {
      setMap(mapInstance);
      onLoad?.(mapInstance);
    });

    return () => {
      setMap(null);
      mapInstance.remove();
    };
  }, [isMounted]); // Only init once

  // Update style when theme changes
  useEffect(() => {
    if (map && currentStyle) {
      map.setStyle(currentStyle);
    }
  }, [map, currentStyle]);

  if (!isMounted) {
    return <div className={`bg-slate-900 animate-pulse ${className}`} />;
  }

  return (
    <MapContext.Provider value={{ map, mapContainer: containerRef.current }}>
      <div ref={containerRef} className={`relative ${className}`}>
        {map && children}
      </div>
    </MapContext.Provider>
  );
}

export function MapMarker({
  longitude,
  latitude,
  options,
  onClick,
  children,
}: MapMarkerProps) {
  const { map } = useContext(MapContext);
  const markerRef = useRef<MapLibreGL.Marker | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const el = document.createElement("div");
    setElement(el);

    const marker = new MapLibreGL.Marker({
      ...options,
      element: el,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (onClick) {
      el.addEventListener("click", () => onClick(marker));
    }

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (e) {
          // Map might already be removed
        }
      }
      el.remove();
    };
  }, [map]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude]);

  if (!element || !children) return null;

  return createPortal(children, element);
}

export function MarkerContent({ children }: { children: ReactNode }) {
  return <div className="cursor-pointer">{children}</div>;
}

export function MapPopup({
  longitude,
  latitude,
  options,
  children,
}: MapPopupProps) {
  const { map } = useContext(MapContext);
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const el = document.createElement("div");
    setElement(el);

    const popup = new MapLibreGL.Popup({
      ...options,
      closeOnClick: false,
    })
      .setLngLat([longitude, latitude])
      .setDOMContent(el)
      .addTo(map);

    popupRef.current = popup;

    return () => {
      if (popupRef.current) {
        try {
          popupRef.current.remove();
        } catch (e) {
          // Map might already be removed
        }
      }
      el.remove();
    };
  }, [map]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude]);

  if (!element) return null;

  return createPortal(children, element);
}

export function MapRoute({
  coordinates,
  id = "route",
  color = "#3b82f6",
  width = 4,
  opacity = 0.6,
  animate = false,
}: MapRouteProps) {
  const { map } = useContext(MapContext);
  const sourceId = `${id}-source`;
  const layerId = `${id}-layer`;

  useEffect(() => {
    if (!map) return;

    const sourceData: any = {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    };

    map.addSource(sourceId, sourceData);

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
      },
    });

    if (animate) {
      // This is a simple animation for dashed lines, MapLibre supports line-dasharray
      // For a solid line animation, we could use a different approach
    }

    return () => {
      if (!map || (map as any).removed) return;
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {
        // Ignore errors during cleanup
      }
    };
  }, [map, coordinates]);

  return null;
}

export function MapControls({
  position = "top-right",
  showZoom = true,
  showLocate = true,
  className,
}: MapControlsProps) {
  const { map } = useContext(MapContext);

  useEffect(() => {
    if (!map) return;

    const controls: MapLibreGL.IControl[] = [];

    if (showZoom) {
      const nav = new MapLibreGL.NavigationControl({ showCompass: true });
      map.addControl(nav, position);
      controls.push(nav);
    }

    if (showLocate) {
      const locate = new MapLibreGL.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });
      map.addControl(locate, position);
      controls.push(locate);
    }

    return () => {
      if (!map || (map as any).removed) return;
      controls.forEach((control) => {
        try {
          // Check if control is still on the map to avoid double removal
          if ((map as any)._controls?.includes(control)) {
            map.removeControl(control);
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
    };
  }, [map]);

  return null;
}
