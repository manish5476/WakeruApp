// src/components/person/LeafletMapView.tsx
// Free map using OpenStreetMap tiles + Leaflet.js via WebView (react-native-webview, already installed)
// No paid API key required. Works cross-platform (iOS, Android, Web).

import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  amount?: number;
  currency?: string;
  category?: string;
  tripName?: string;
  emoji?: string;
  type?: 'expense' | 'stop';
  subtitle?: string;
}

interface LeafletMapViewProps {
  markers: MapMarker[];
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  stay: '#8B5CF6',
  transport: '#3B82F6',
  activity: '#10B981',
  shopping: '#EC4899',
  health: '#EF4444',
  other: '#6366F1',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

function formatAmount(amount?: number, currency?: string): string {
  if (amount == null || amount === 0) return '';
  const currSym = currency === 'INR' || !currency ? '₹' : `${currency} `;
  if (amount >= 100000) return `${currSym}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currSym}${(amount / 1000).toFixed(1)}K`;
  return `${currSym}${amount.toLocaleString('en-IN')}`;
}

function buildHtml(markers: MapMarker[], isDark: boolean): string {
  const validMarkers = markers.filter(
    m =>
      typeof m.lat === 'number' &&
      typeof m.lng === 'number' &&
      !isNaN(m.lat) &&
      !isNaN(m.lng) &&
      m.lat !== 0 &&
      m.lng !== 0,
  );

  // Extract unique categories present in the markers
  const categoriesPresent = Array.from(
    new Set(validMarkers.map(m => m.category || 'other')),
  );

  const markersJson = JSON.stringify(
    validMarkers.map(m => {
      const cat = m.category || 'other';
      return {
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title || 'Location',
        amount: formatAmount(m.amount, m.currency),
        category: cat,
        tripName: m.tripName || '',
        emoji: m.emoji || CATEGORY_EMOJIS[cat] || '📍',
        color: CATEGORY_COLORS[cat] || '#6366F1',
        type: m.type || 'expense',
        subtitle: m.subtitle || '',
      };
    }),
  );

  const categoriesJson = JSON.stringify(
    categoriesPresent.map(cat => ({
      key: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      emoji: CATEGORY_EMOJIS[cat] || '📦',
      count: validMarkers.filter(m => (m.category || 'other') === cat).length,
    })),
  );

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const attribution =
    '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

  const bgColor = isDark ? '#121214' : '#F4F4F6';
  const cardBg = isDark ? '#1E1E22' : '#FFFFFF';
  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const subTextColor = isDark ? '#A1A1AA' : '#71717A';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif; overflow: hidden; }

  /* Map Container */
  #map { position: relative; }

  /* Top Filter Controls Bar */
  .filter-container {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    padding: 2px 2px 6px 2px;
    scrollbar-width: none;
    pointer-events: auto;
  }
  .filter-container::-webkit-scrollbar { display: none; }

  .filter-chip {
    background: ${cardBg};
    color: ${subTextColor};
    border: 1px solid ${borderColor};
    box-shadow: 0 2px 8px rgba(0,0,0,0.14);
    border-radius: 20px;
    padding: 5px 11px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;
    user-select: none;
    backdrop-filter: blur(8px);
  }
  .filter-chip:hover {
    color: ${textColor};
    border-color: rgba(99, 102, 241, 0.4);
  }
  .filter-chip.active {
    background: #6366F1;
    color: #FFFFFF;
    border-color: #6366F1;
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.45);
  }
  .filter-chip.active .chip-count {
    background: rgba(255, 255, 255, 0.25);
    color: #FFFFFF;
  }
  .chip-count {
    background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
    padding: 1px 5px;
    border-radius: 10px;
    font-size: 10px;
  }

  /* Floating Action Buttons */
  .floating-actions {
    position: absolute;
    bottom: 24px;
    right: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: auto;
  }
  .action-btn {
    background: ${cardBg};
    color: ${textColor};
    border: 1px solid ${borderColor};
    box-shadow: 0 3px 10px rgba(0,0,0,0.18);
    border-radius: 12px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    backdrop-filter: blur(8px);
  }
  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 14px rgba(0,0,0,0.25);
  }
  .action-btn:active {
    transform: translateY(1px);
  }

  /* Marker Pin Structure */
  .custom-pin-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }
  .pin-head {
    width: 34px;
    height: 34px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #FFFFFF;
    box-shadow: 0 4px 10px rgba(0,0,0,0.32);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
  }
  .pin-head:hover {
    transform: rotate(-45deg) scale(1.08);
  }
  .pin-emoji {
    transform: rotate(45deg);
    font-size: 15px;
    line-height: 1;
  }
  .pin-amount-pill {
    margin-top: 3px;
    background: ${cardBg};
    color: ${textColor};
    font-size: 10px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    border: 1px solid ${borderColor};
    white-space: nowrap;
    line-height: 14px;
  }

  /* Cluster Icon */
  .custom-cluster {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    border: 2.5px solid #FFFFFF;
    border-radius: 50%;
    color: #FFF;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
    transition: transform 0.15s ease;
  }
  .custom-cluster:hover {
    transform: scale(1.08);
  }

  /* Modern Popup */
  .leaflet-popup-content-wrapper {
    background: ${cardBg};
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.24);
    border: 1px solid ${borderColor};
    padding: 0;
    overflow: hidden;
  }
  .leaflet-popup-content {
    margin: 0;
    min-width: 200px;
  }
  .leaflet-popup-tip {
    background: ${cardBg};
  }
  .leaflet-popup-close-button {
    color: ${subTextColor} !important;
    font-size: 18px !important;
    top: 8px !important;
    right: 10px !important;
  }
  .popup-body {
    padding: 14px 16px 14px;
  }
  .popup-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .popup-emoji {
    font-size: 22px;
    line-height: 1;
  }
  .popup-title {
    font-size: 14px;
    font-weight: 700;
    color: ${textColor};
    line-height: 1.25;
  }
  .popup-amount {
    font-size: 17px;
    font-weight: 800;
    color: #6366F1;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .popup-trip {
    font-size: 11px;
    font-weight: 600;
    color: ${subTextColor};
    margin-top: 2px;
  }
  .popup-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Leaflet Default Control Adjustments */
  .leaflet-bottom.leaflet-right {
    margin-bottom: 8px;
    margin-right: 8px;
  }
  .leaflet-control-zoom {
    border: 1px solid ${borderColor} !important;
    box-shadow: 0 3px 10px rgba(0,0,0,0.15) !important;
    border-radius: 10px !important;
    overflow: hidden;
  }
  .leaflet-control-zoom a {
    background: ${cardBg} !important;
    color: ${textColor} !important;
    border-color: ${borderColor} !important;
  }
  .leaflet-control-attribution {
    font-size: 9px !important;
    background: rgba(0,0,0,0.3) !important;
    color: #888 !important;
    border-radius: 4px;
    margin: 4px !important;
    padding: 1px 4px !important;
  }
  .leaflet-control-attribution a { color: #aaa !important; }
</style>
</head>
<body>
<div id="map">
  <!-- Filter Chips Bar -->
  <div class="filter-container" id="filterBar"></div>

  <!-- Floating Controls -->
  <div class="floating-actions">
    <button class="action-btn" id="btnFitAll" title="Fit all locations">🎯</button>
    <button class="action-btn" id="btnResetView" title="Reset view">↺</button>
  </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
  var allMarkers = ${markersJson};
  var categories = ${categoriesJson};
  var currentCategory = 'all';

  var map = L.map('map', {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
  });

  // Zoom control at bottom right (above attribution)
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('${tileUrl}', {
    attribution: '${attribution}',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Cluster group
  var clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function(cluster) {
      var count = cluster.getChildCount();
      var size = count < 10 ? 36 : count < 100 ? 42 : 48;
      return L.divIcon({
        html: '<div class="custom-cluster" style="width:' + size + 'px;height:' + size + 'px;">' + count + '</div>',
        className: '',
        iconSize: L.point(size, size),
      });
    },
  });

  map.addLayer(clusterGroup);

  // Initial bounds computation
  var initialBounds = allMarkers.map(function(m) { return [m.lat, m.lng]; });
  var initialCenter = [20.5937, 78.9629];
  var initialZoom = 5;

  function renderCategoryChips() {
    var bar = document.getElementById('filterBar');
    if (!bar) return;
    bar.innerHTML = '';

    if (categories.length <= 1) {
      bar.style.display = 'none';
      return;
    }

    // All chip
    var allBtn = document.createElement('button');
    allBtn.className = 'filter-chip' + (currentCategory === 'all' ? ' active' : '');
    allBtn.innerHTML = '<span>All</span> <span class="chip-count">' + allMarkers.length + '</span>';
    allBtn.onclick = function() { setCategory('all'); };
    bar.appendChild(allBtn);

    // Each Category Chip
    categories.forEach(function(c) {
      var btn = document.createElement('button');
      btn.className = 'filter-chip' + (currentCategory === c.key ? ' active' : '');
      btn.innerHTML = '<span>' + c.emoji + ' ' + c.label + '</span> <span class="chip-count">' + c.count + '</span>';
      btn.onclick = function() { setCategory(c.key); };
      bar.appendChild(btn);
    });
  }

  function setCategory(cat) {
    currentCategory = cat;
    renderCategoryChips();
    applyFilter();
  }

  function applyFilter() {
    clusterGroup.clearLayers();
    var filtered = allMarkers.filter(function(m) {
      return currentCategory === 'all' || m.category === currentCategory;
    });

    var bounds = [];

    filtered.forEach(function(m) {
      var pinColor = m.color || '#6366F1';
      var markerHtml = '<div class="custom-pin-wrap">' +
        '<div class="pin-head" style="background:' + pinColor + ';">' +
        '<span class="pin-emoji">' + m.emoji + '</span>' +
        '</div>' +
        (m.amount ? '<div class="pin-amount-pill">' + m.amount + '</div>' : '') +
        '</div>';

      var icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [36, m.amount ? 54 : 36],
        iconAnchor: [18, m.amount ? 54 : 36],
        popupAnchor: [0, m.amount ? -54 : -36],
      });

      var popupHtml = '<div class="popup-body">' +
        '<div class="popup-header">' +
        '<span class="popup-emoji">' + m.emoji + '</span>' +
        '<div>' +
        '<div class="popup-title">' + (m.title || 'Location') + '</div>' +
        (m.tripName ? '<div class="popup-trip">📍 ' + m.tripName + '</div>' : '') +
        '</div>' +
        '</div>' +
        (m.amount ? '<div class="popup-amount">' + m.amount + '</div>' : '') +
        (m.subtitle ? '<div class="popup-trip">' + m.subtitle + '</div>' : '') +
        '<span class="popup-tag" style="background:' + pinColor + '20;color:' + pinColor + ';">' + m.category + '</span>' +
        '</div>';

      var marker = L.marker([m.lat, m.lng], { icon: icon })
        .bindPopup(popupHtml, { maxWidth: 260, closeButton: true });

      clusterGroup.addLayer(marker);
      bounds.push([m.lat, m.lng]);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 13, { animate: true });
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }

  // Floating Actions
  document.getElementById('btnFitAll').onclick = function() {
    var activeBounds = clusterGroup.getBounds();
    if (activeBounds && activeBounds.isValid()) {
      map.fitBounds(activeBounds, { padding: [50, 50], maxZoom: 15, animate: true });
    } else if (initialBounds.length > 0) {
      map.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  };

  document.getElementById('btnResetView').onclick = function() {
    if (initialBounds.length === 1) {
      map.setView(initialBounds[0], 13, { animate: true });
    } else if (initialBounds.length > 1) {
      map.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 14, animate: true });
    } else {
      map.setView(initialCenter, initialZoom, { animate: true });
    }
  };

  // Initial setup
  renderCategoryChips();
  applyFilter();

  if (initialBounds.length === 0) {
    map.setView(initialCenter, initialZoom);
  } else if (initialBounds.length === 1) {
    map.setView(initialBounds[0], 13);
  } else {
    map.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 14 });
  }
</script>
</body>
</html>`;
}

export function LeafletMapView({ markers, height = 320 }: LeafletMapViewProps) {
  const theme = useTheme();
  const webViewRef = useRef<any>(null);

  const validMarkers = useMemo(
    () =>
      markers.filter(
        m =>
          typeof m.lat === 'number' &&
          typeof m.lng === 'number' &&
          !isNaN(m.lat) &&
          !isNaN(m.lng) &&
          m.lat !== 0 &&
          m.lng !== 0,
      ),
    [markers],
  );

  const html = useMemo(
    () => buildHtml(validMarkers, theme.isDark),
    [validMarkers, theme.isDark],
  );

  if (validMarkers.length === 0) {
    return (
      <View
        style={[
          styles.emptyMap,
          {
            height,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)',
            borderColor: theme.colors.borderLight,
          },
        ]}
      >
        <AppIcon
          name="map-pin-off"
          size={32}
          color={theme.colors.textTertiary}
        />
        <Text
          style={[styles.emptyMapText, { color: theme.colors.textSecondary }]}
        >
          No location coordinates found
        </Text>
        <Text
          style={[styles.emptyMapSub, { color: theme.colors.textTertiary }]}
        >
          Trip stops and expenses with coordinates will appear plotted here
          automatically
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapContainer, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyMap: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  emptyMapText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyMapSub: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
});
