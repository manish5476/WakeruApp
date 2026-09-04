// src/components/map/LeafletMap.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewComponent: any = WebView;
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { haptics } from '../../utils/haptics';
import GlobalLoader from '../common/GlobalLoader';

// --- Types ---
export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  name?: string;
  subtitle?: string;
  emoji?: string;
  type?: 'stop' | 'expense' | 'user' | 'custom';
  color?: string;
  amount?: number;
  category?: string;
  paidByName?: string;
  timestamp?: string;
  isHighlighted?: boolean;
  clusterGroup?: string;
}

export interface LeafletPolyline {
  latitude: number;
  longitude: number;
}

export interface LeafletRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapControls {
  showZoom?: boolean;
  showFullscreen?: boolean;
  showLocate?: boolean;
  showLegend?: boolean;
  showAttribution?: boolean;
  showScale?: boolean;
  showLayerToggle?: boolean;
}

interface LeafletMapProps {
  markers?: LeafletMarker[];
  polylines?: LeafletPolyline[];
  initialRegion?: LeafletRegion;
  interactive?: boolean;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (markerId: string) => void;
  onMarkerLongPress?: (markerId: string) => void;
  onClusterClick?: (cluster: any) => void;
  style?: any;
  darkMode?: boolean;
  mapStyle?: 'voyager' | 'satellite' | 'dark' | 'positron';
  height?: number;
  autoFitOnUpdate?: boolean;
  showControls?: boolean;
  controls?: MapControls;
  loadingMessage?: string;
  onMapReady?: () => void;
  onError?: (error: Error) => void;
  enableClustering?: boolean;
  clusterRadius?: number;
  showAttribution?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface LeafletMapRef {
  animateToRegion: (
    coordinate: {
      latitude: number;
      longitude: number;
      latitudeDelta?: number;
      longitudeDelta?: number;
    },
    zoom?: number,
  ) => void;
  resetBounds: () => void;
  flyTo: (
    coordinate: { latitude: number; longitude: number },
    zoom?: number,
  ) => void;
  fitToMarkers: (padding?: number) => void;
  selectMarker: (markerId: string) => void;
  setMapType: (type: 'voyager' | 'satellite' | 'dark' | 'positron') => void;
  getCenter: () => { latitude: number; longitude: number };
  getZoom: () => number;
  setZoom: (zoom: number) => void;
}

// --- Default Controls ---
const DEFAULT_CONTROLS: Required<MapControls> = {
  showZoom: true,
  showFullscreen: false,
  showLocate: true,
  showLegend: true,
  showAttribution: false,
  showScale: true,
  showLayerToggle: true,
};

// --- Build HTML ---
function buildHtml(
  initialRegion: Required<Pick<LeafletRegion, 'latitude' | 'longitude'>>,
  isDark: boolean,
  controls: Required<MapControls> = DEFAULT_CONTROLS,
  minZoom: number = 3,
  maxZoom: number = 19,
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html {
          width: 100%; height: 100%; overflow: hidden;
          background-color: ${isDark ? '#0F172A' : '#F1F5F9'};
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          touch-action: none;
        }
        #map { width: 100%; height: 100%; }

        /* --- STOP PIN (DESTINATION CARD) --- */
        .stop-pin-wrapper {
          background: none !important;
          border: none !important;
          cursor: pointer;
        }
        .stop-pin-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stop-pin-container:hover {
          transform: translateY(-6px) scale(1.06);
          z-index: 1000 !important;
        }
        .stop-pin-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.98)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
          padding: 6px 12px 6px 8px;
          border-radius: 999px;
          box-shadow: 0 10px 30px -4px rgba(0, 0, 0, ${isDark ? '0.6' : '0.18'}), 0 4px 12px rgba(0,0,0,0.08);
        }
        .stop-pin-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B00, #EA580C);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.4);
        }
        .stop-pin-text {
          display: flex;
          flex-direction: column;
        }
        .stop-pin-title {
          font-size: 12px;
          font-weight: 800;
          color: ${isDark ? '#F8FAFC' : '#0F172A'};
          white-space: nowrap;
          letter-spacing: -0.2px;
        }
        .stop-pin-badge {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          margin-top: -1px;
        }
        .stop-pin-beak {
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 8px solid ${isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.98)'};
          margin-top: -1px;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.15));
        }
        .stop-pin-pulse {
          position: absolute;
          bottom: -4px;
          width: 14px;
          height: 6px;
          background: rgba(234, 88, 12, 0.4);
          border-radius: 50%;
          filter: blur(2px);
          animation: pinPulse 2s ease-in-out infinite alternate;
        }
        @keyframes pinPulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0.8; }
        }

        /* --- EXPENSE PIN (CHIC CIRCULAR CHIP) --- */
        .expense-pin-wrapper {
          background: none !important;
          border: none !important;
          cursor: pointer;
        }
        .expense-pin {
          display: flex;
          align-items: center;
          background: ${isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.96)'};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 999px;
          padding: 3px 8px 3px 4px;
          border: 1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
          box-shadow: 0 6px 20px rgba(0, 0, 0, ${isDark ? '0.4' : '0.12'});
          gap: 5px;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .expense-pin-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #FFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .expense-pin-amount {
          font-size: 11px;
          font-weight: 800;
          color: ${isDark ? '#F1F5F9' : '#0F172A'};
          white-space: nowrap;
          letter-spacing: -0.3px;
        }
        .expense-pin-wrapper:hover .expense-pin {
          transform: translateY(-4px) scale(1.15);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
          border-color: #EA580C;
          z-index: 1000 !important;
        }

        /* --- CLUSTER BADGE --- */
        .modern-cluster-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 13px;
          background: linear-gradient(135deg, #FF6B00 0%, #EA580C 50%, #C2410C 100%);
          border: 3px solid ${isDark ? '#0F172A' : '#FFFFFF'};
          box-shadow: 0 8px 24px rgba(234, 88, 12, 0.45);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }
        .modern-cluster-badge:hover {
          transform: scale(1.18);
          box-shadow: 0 12px 32px rgba(234, 88, 12, 0.65);
        }

        /* --- ROUTE PATHS --- */
        .premium-route {
          filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.5));
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .premium-route-dashed {
          stroke-dasharray: 10, 8;
          animation: dash 2.5s linear infinite;
        }
        @keyframes dash { to { stroke-dashoffset: -36; } }

        /* --- POPUP & TOOLTIP CARD --- */
        .leaflet-popup-content-wrapper, .leaflet-hover-tooltip {
          background: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'} !important;
          color: ${isDark ? '#F8FAFC' : '#0F172A'} !important;
          border-radius: 16px !important;
          box-shadow: 0 16px 40px -6px rgba(0, 0, 0, ${isDark ? '0.6' : '0.18'}) !important;
          padding: 2px !important;
          border: 1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)'} !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
        }
        .leaflet-hover-tooltip {
          pointer-events: auto !important;
          padding: 8px 12px !important;
        }
        .leaflet-hover-tooltip::before {
          border-top-color: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'} !important;
        }
        .leaflet-popup-content {
          margin: 8px 10px !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: ${isDark ? '#0F172A' : '#FFFFFF'} !important;
        }
        .popup-card-root {
          min-width: 170px;
          max-width: 250px;
        }
        .popup-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .popup-info-main {
          flex: 1;
          min-width: 0;
        }
        .popup-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .popup-title {
          font-size: 12px;
          font-weight: 800;
          color: ${isDark ? '#FFFFFF' : '#0F172A'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popup-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #EA580C;
          margin-top: 1px;
        }
        .popup-amount {
          font-size: 12px;
          font-weight: 800;
          color: #EA580C;
          margin-top: 1px;
        }
        .popup-meta {
          font-size: 10px;
          font-weight: 600;
          color: ${isDark ? '#94A3B8' : '#64748B'};
          margin-top: 5px;
          padding-top: 4px;
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
        }
        .popup-gmaps-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: ${isDark ? 'rgba(234, 88, 12, 0.22)' : '#FFF7ED'};
          color: #EA580C !important;
          border: 1px solid rgba(234, 88, 12, 0.4);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 6px;
          flex-shrink: 0;
        }
        .popup-gmaps-btn:hover {
          background: #EA580C !important;
          color: #FFFFFF !important;
          border-color: #EA580C !important;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
          transform: translateY(-1px);
        }

        /* --- CONTROLS OVERLAY --- */
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
          margin: 20px !important;
        }
        .leaflet-control-zoom a {
          background: ${isDark ? '#1E293B' : '#FFFFFF'} !important;
          color: ${isDark ? '#F8FAFC' : '#0F172A'} !important;
          border: none !important;
          width: 40px !important; height: 40px !important;
          line-height: 40px !important;
          font-size: 18px !important; font-weight: 700 !important;
          transition: all 0.2s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background: ${isDark ? '#334155' : '#F1F5F9'} !important;
          color: #EA580C !important;
        }
        .leaflet-control-zoom a:first-child {
          border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;
        }

        /* Custom layer switcher pill */
        .layer-switcher {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          background: ${isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
          padding: 4px;
          border-radius: 999px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          gap: 2px;
        }
        .layer-btn {
          border: none;
          background: none;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: ${isDark ? '#94A3B8' : '#64748B'};
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .layer-btn.active {
          background: #EA580C;
          color: #FFF;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>

      <!-- Layer Switcher -->
      ${
        controls.showLayerToggle
          ? `
        <div class="layer-switcher">
          <button class="layer-btn active" id="btn-streets" onclick="switchLayer('streets')">🗺️ Streets</button>
          <button class="layer-btn" id="btn-satellite" onclick="switchLayer('satellite')">🛰️ Satellite</button>
          <button class="layer-btn" id="btn-dark" onclick="switchLayer('dark')">🌙 Dark</button>
        </div>
      `
          : ''
      }

      <script>
        var isDark = ${isDark};

        var map = L.map('map', {
          zoomControl: false,
          attributionControl: ${controls.showAttribution},
          minZoom: ${minZoom},
          maxZoom: ${maxZoom},
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
        }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 11);

        // --- Tile Layers (100% Free, Zero API Keys, No Watermarks) ---
        var streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: '&copy; Esri &copy; OpenStreetMap'
        });

        var darkLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 16,
          attribution: '&copy; Esri &copy; OpenStreetMap'
        });

        var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: '&copy; Esri'
        });

        // Set initial layer
        var currentLayer = isDark ? darkLayer : streetLayer;
        currentLayer.addTo(map);

        window.switchLayer = function(layerName) {
          map.removeLayer(streetLayer);
          map.removeLayer(darkLayer);
          map.removeLayer(satelliteLayer);

          document.querySelectorAll('.layer-btn').forEach(function(b) { b.classList.remove('active'); });

          if (layerName === 'satellite') {
            satelliteLayer.addTo(map);
            var btn = document.getElementById('btn-satellite');
            if (btn) btn.classList.add('active');
          } else if (layerName === 'dark') {
            darkLayer.addTo(map);
            var btn = document.getElementById('btn-dark');
            if (btn) btn.classList.add('active');
          } else {
            streetLayer.addTo(map);
            var btn = document.getElementById('btn-streets');
            if (btn) btn.classList.add('active');
          }
        };

        window.map = map;

        ${controls.showZoom ? `L.control.zoom({ position: 'bottomright' }).addTo(map);` : ''}

        // --- Groups ---
        var stopsGroup = L.featureGroup().addTo(map);
        var expenseCluster = L.markerClusterGroup({
          maxClusterRadius: 40,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          iconCreateFunction: function(cluster) {
            var count = cluster.getChildCount();
            var size = count > 15 ? 44 : count > 5 ? 38 : 32;
            return L.divIcon({
              html: '<div class="modern-cluster-badge" style="width:' + size + 'px;height:' + size + 'px;">' + count + '</div>',
              className: 'expense-pin-wrapper',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
          }
        }).addTo(map);

        var userGroup = L.featureGroup().addTo(map);
        var routeLayer = null;
        var markersMap = {};

        function postToHost(payload) {
          var msg = JSON.stringify(payload);
          if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(msg); }
          else { window.parent.postMessage(msg, '*'); }
        }

        function buildMarker(m) {
          var marker;
          var gmapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + m.latitude + ',' + m.longitude;
          var gmapsBtn = '<a href="' + gmapsUrl + '" target="_blank" rel="noopener noreferrer" class="popup-gmaps-btn" title="Open in Google Maps" onclick="event.stopPropagation();">' +
            '<span>Maps</span>' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>' +
          '</a>';

          if (m.type === 'expense') {
            var color = m.color || '#EA580C';
            var emoji = m.emoji || '📌';
            var amountStr = m.amount ? '₹' + Number(m.amount).toLocaleString() : '';

            var html = '<div class="expense-pin">' +
              '<div class="expense-pin-icon" style="background: linear-gradient(135deg, ' + color + ', ' + color + 'CC);">' + emoji + '</div>' +
              (amountStr ? '<span class="expense-pin-amount">' + amountStr + '</span>' : '') +
            '</div>';

            var icon = L.divIcon({
              className: 'expense-pin-wrapper',
              html: html,
              iconSize: [100, 30],
              iconAnchor: [50, 15]
            });
            marker = L.marker([m.latitude, m.longitude], { icon: icon });

            var popupHtml = '<div class="popup-card-root">' +
              '<div class="popup-header">' +
                '<div class="popup-icon" style="background:' + color + '20; color:' + color + ';">' + emoji + '</div>' +
                '<div class="popup-info-main">' +
                  '<div class="popup-title">' + (m.title || 'Expense') + '</div>' +
                  (amountStr ? '<div class="popup-amount">' + amountStr + '</div>' : '') +
                '</div>' +
                gmapsBtn +
              '</div>' +
              (m.paidByName ? '<div class="popup-meta">Paid by ' + m.paidByName + '</div>' : '') +
            '</div>';

            marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: false });
            marker.bindTooltip(popupHtml, { direction: 'top', offset: [0, -15], opacity: 1, className: 'leaflet-hover-tooltip' });

          } else {
            // Stop Pin
            var emoji = m.emoji || '📍';
            var subtitle = m.subtitle || '';

            var html = '<div class="stop-pin-container">' +
              '<div class="stop-pin-card">' +
                '<div class="stop-pin-icon-wrap">' + emoji + '</div>' +
                '<div class="stop-pin-text">' +
                  '<span class="stop-pin-title">' + (m.name || 'Stop') + '</span>' +
                  (subtitle ? '<span class="stop-pin-badge">' + subtitle + '</span>' : '') +
                '</div>' +
              '</div>' +
              '<div class="stop-pin-beak"></div>' +
              '<div class="stop-pin-pulse"></div>' +
            '</div>';

            var icon = L.divIcon({
              className: 'stop-pin-wrapper',
              html: html,
              iconSize: [140, 60],
              iconAnchor: [70, 56]
            });
            marker = L.marker([m.latitude, m.longitude], { icon: icon, zIndexOffset: 500 });

            var popupHtml = '<div class="popup-card-root">' +
              '<div class="popup-header">' +
                '<div class="popup-icon" style="background: rgba(234, 88, 12, 0.15); color: #EA580C;">' + emoji + '</div>' +
                '<div class="popup-info-main">' +
                  '<div class="popup-title">' + (m.name || 'Destination') + '</div>' +
                  (subtitle ? '<div class="popup-subtitle">' + subtitle + '</div>' : '') +
                '</div>' +
                gmapsBtn +
              '</div>' +
            '</div>';

            marker.bindPopup(popupHtml, { offset: [0, -40], closeButton: false });
            marker.bindTooltip(popupHtml, { direction: 'top', offset: [0, -45], opacity: 1, className: 'leaflet-hover-tooltip' });
          }

          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            postToHost({ type: 'markerPress', id: m.id });
          });

          markersMap[m.id] = marker;
          return marker;
        }

        function setMarkers(markersData, autoFit) {
          stopsGroup.clearLayers();
          expenseCluster.clearLayers();
          markersMap = {};

          (markersData || []).forEach(function(m) {
            var marker = buildMarker(m);
            if (m.type === 'expense') {
              expenseCluster.addLayer(marker);
            } else {
              stopsGroup.addLayer(marker);
            }
          });

          if (autoFit) { window.fitToMarkers(); }
        }

        function setPolyline(coords) {
          if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
          if (coords && coords.length > 1) {
            var latlngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
            routeLayer = L.polyline(latlngs, {
              color: '#EA580C',
              weight: 4,
              opacity: 0.9,
              className: 'premium-route premium-route-dashed',
              smoothFactor: 1,
              noClip: true,
            }).addTo(map);
          }
        }

        window.fitToMarkers = function(padding) {
          var layers = stopsGroup.getLayers().concat(expenseCluster.getLayers());
          if (layers.length > 0) {
            var group = L.featureGroup(layers);
            map.fitBounds(group.getBounds().pad(padding || 0.2));
          } else {
            map.setView([${initialRegion.latitude}, ${initialRegion.longitude}], 11);
          }
        };

        window.selectMarker = function(id) {
          var marker = markersMap[id];
          if (marker) {
            map.flyTo(marker.getLatLng(), 15, { duration: 1.2 });
            setTimeout(function() { marker.openPopup(); }, 800);
          }
        };

        window.setMarkers = setMarkers;
        window.setPolyline = setPolyline;
        window.flyTo = function(lat, lng, zoom) {
          map.flyTo([lat, lng], zoom || 15, { duration: 1.2 });
        };
        window.animateToRegion = function(lat, lng, zoom) {
          map.setView([lat, lng], zoom || 14, { animate: true, duration: 0.8 });
        };

        setMarkers(${'window.__initialMarkers || []'}, false);
        setPolyline(${'window.__initialPolylines || []'});

        if (!window.ReactNativeWebView) {
          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'eval' && e.data.script) { eval(e.data.script); }
          });
        }

        setTimeout(function() {
          window.fitToMarkers();
          postToHost({ type: 'ready' });
        }, 300);
      </script>
    </body>
    </html>
  `;
}

// --- Main Component ---
export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  (
    {
      markers = [],
      polylines = [],
      initialRegion = { latitude: 20.5937, longitude: 78.9629 },
      interactive = false,
      onMapPress,
      onMarkerPress,
      onMarkerLongPress,
      onClusterClick,
      style,
      darkMode = false,
      mapStyle = 'voyager',
      height = 300,
      autoFitOnUpdate = true,
      showControls = true,
      controls = DEFAULT_CONTROLS,
      loadingMessage = 'Loading map...',
      onMapReady,
      onError,
      enableClustering = true,
      clusterRadius = 46,
      showAttribution = false,
      minZoom = 3,
      maxZoom = 19,
    },
    ref,
  ) => {
    const theme = useTheme();
    const webViewRef = useRef<WebView>(null);
    const isReadyRef = useRef(false);
    const isDark = darkMode || theme.isDark;
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const mergedControls: Required<MapControls> = {
      showZoom: controls?.showZoom ?? DEFAULT_CONTROLS.showZoom,
      showFullscreen:
        controls?.showFullscreen ?? DEFAULT_CONTROLS.showFullscreen,
      showLocate: controls?.showLocate ?? DEFAULT_CONTROLS.showLocate,
      showLegend: controls?.showLegend ?? DEFAULT_CONTROLS.showLegend,
      showAttribution:
        controls?.showAttribution ??
        showAttribution ??
        DEFAULT_CONTROLS.showAttribution,
      showScale: controls?.showScale ?? DEFAULT_CONTROLS.showScale,
      showLayerToggle:
        controls?.showLayerToggle ?? DEFAULT_CONTROLS.showLayerToggle,
    };

    const htmlContent = useMemo(() => {
      let html = buildHtml(
        {
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
        },
        isDark,
        mergedControls,
        minZoom,
        maxZoom,
      );
      html = html
        .replace('window.__initialMarkers || []', JSON.stringify(markers))
        .replace('window.__initialPolylines || []', JSON.stringify(polylines))
        .replace('window.__interactive || false', String(interactive))
        .replace('window.__enableClustering || true', String(enableClustering));
      return html;
    }, [
      initialRegion.latitude,
      initialRegion.longitude,
      isDark,
      mergedControls,
      minZoom,
      maxZoom,
      interactive,
      enableClustering,
    ]);

    const runScript = useCallback((script: string) => {
      if (Platform.OS === 'web') {
        const iframe = document.getElementById(
          'leaflet-map-iframe',
        ) as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'eval', script }, '*');
        }
      } else {
        webViewRef.current?.injectJavaScript(script);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      animateToRegion: (coordinate, zoom = 14) => {
        runScript(
          `if (window.animateToRegion) { window.animateToRegion(${coordinate.latitude}, ${coordinate.longitude}, ${zoom}); } true;`,
        );
      },
      resetBounds: () => {
        runScript('if (window.fitToMarkers) { window.fitToMarkers(); } true;');
      },
      flyTo: (coordinate, zoom = 15) => {
        runScript(
          `if (window.flyTo) { window.flyTo(${coordinate.latitude}, ${coordinate.longitude}, ${zoom}); } true;`,
        );
      },
      fitToMarkers: (padding = 0.2) => {
        runScript(
          `if (window.fitToMarkers) { window.fitToMarkers(${padding}); } true;`,
        );
      },
      selectMarker: (markerId: string) => {
        runScript(
          `if (window.selectMarker) { window.selectMarker('${markerId}'); } true;`,
        );
      },
      setMapType: (type: 'voyager' | 'satellite' | 'dark' | 'positron') => {
        runScript(
          `if (window.switchLayer) { window.switchLayer('${type === 'voyager' ? 'streets' : type}'); } true;`,
        );
      },
      getCenter: () => ({ latitude: 0, longitude: 0 }),
      getZoom: () => 0,
      setZoom: zoom => {
        runScript(`if (window.setZoom) { window.setZoom(${zoom}); } true;`);
      },
    }));

    const markersKey = useMemo(() => JSON.stringify(markers), [markers]);
    const polylinesKey = useMemo(() => JSON.stringify(polylines), [polylines]);

    useEffect(() => {
      if (!isReadyRef.current) return;
      runScript(
        `if (window.setMarkers) { window.setMarkers(${markersKey}, false); } true;`,
      );
    }, [markersKey, autoFitOnUpdate, runScript]);

    useEffect(() => {
      if (!isReadyRef.current) return;
      runScript(
        `if (window.setPolyline) { window.setPolyline(${polylinesKey}); } true;`,
      );
    }, [polylinesKey, runScript]);

    const handleIncomingMessage = useCallback(
      (raw: string) => {
        try {
          const data = JSON.parse(raw);
          if (data.type === 'ready') {
            isReadyRef.current = true;
            setIsLoading(false);
            onMapReady?.();
            haptics?.light?.();
          } else if (data.type === 'markerPress' && onMarkerPress) {
            haptics?.light?.();
            onMarkerPress(data.id);
          } else if (data.type === 'markerLongPress' && onMarkerLongPress) {
            haptics?.medium?.();
            onMarkerLongPress(data.id);
          } else if (data.type === 'mapPress' && onMapPress) {
            haptics?.light?.();
            onMapPress({ latitude: data.latitude, longitude: data.longitude });
          } else if (data.type === 'clusterClick' && onClusterClick) {
            onClusterClick(data.cluster);
          } else if (data.type === 'error') {
            setMapError(data.message || 'Map error');
            onError?.(new Error(data.message));
          }
        } catch (e) {}
      },
      [
        onMarkerPress,
        onMarkerLongPress,
        onMapPress,
        onClusterClick,
        onMapReady,
        onError,
      ],
    );

    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const handleWebMessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') handleIncomingMessage(event.data);
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }, [handleIncomingMessage]);

    const handleMessage = (event: any) =>
      handleIncomingMessage(event.nativeEvent.data);

    const handleError = (error: any) => {
      setIsLoading(false);
      setMapError(error.message || 'Failed to load map');
      onError?.(error);
    };

    const localStyles = StyleSheet.create({
      container: {
        overflow: 'hidden',
        height,
        width: '100%',
        position: 'relative',
      },
      webview: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      },
      loading: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
        gap: 16,
      },
      loadingText: {
        marginTop: 8,
      },
      errorContainer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
        padding: 24,
      },
      errorIcon: {
        marginBottom: 12,
      },
      errorMessage: {
        textAlign: 'center',
        marginBottom: 16,
        maxWidth: 300,
      },
      retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
      },
      retryButtonText: {
        fontWeight: '600',
      },
    });

    if (mapError) {
      return (
        <View style={[localStyles.container, style]}>
          <GlassCard
            variant="medium"
            padding="lg"
            style={localStyles.errorContainer}
          >
            <View style={localStyles.errorIcon}>
              <Typography variant="h1">âš ï¸</Typography>
            </View>
            <Typography
              variant="body"
              color="textPrimary"
              style={localStyles.errorMessage}
            >
              {mapError}
            </Typography>
            <TouchableOpacity
              style={[
                localStyles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                setMapError(null);
                setIsLoading(true);
              }}
            >
              <Typography
                variant="caption"
                color="textInverse"
                style={localStyles.retryButtonText}
              >
                Retry
              </Typography>
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    return (
      <View style={[localStyles.container, style]}>
        {Platform.OS === 'web' ? (
          <iframe
            id="leaflet-map-iframe"
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="TripSplit Map"
          />
        ) : (
          <WebViewComponent
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={localStyles.webview}
            onMessage={handleMessage}
            onError={handleError}
            onLoadEnd={() => setIsLoading(false)}
            renderLoading={() => (
              <View style={localStyles.loading}>
                <GlobalLoader variant="inline" size="large" color="#EA580C" />
                <Typography
                  variant="caption"
                  color="textTertiary"
                  style={localStyles.loadingText}
                >
                  {loadingMessage}
                </Typography>
              </View>
            )}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            scrollEnabled={false}
            bounces={false}
          />
        )}
      </View>
    );
  },
);

LeafletMap.displayName = 'LeafletMap';

// --- Helper Hook ---
export function useLeafletMap() {
  const mapRef = useRef<LeafletMapRef>(null);

  const fitToMarkers = useCallback((padding?: number) => {
    mapRef.current?.fitToMarkers(padding);
  }, []);

  const flyTo = useCallback(
    (coordinate: { latitude: number; longitude: number }, zoom?: number) => {
      mapRef.current?.flyTo(coordinate, zoom);
    },
    [],
  );

  const resetBounds = useCallback(() => {
    mapRef.current?.resetBounds();
  }, []);

  const animateToRegion = useCallback(
    (
      coordinate: {
        latitude: number;
        longitude: number;
        latitudeDelta?: number;
        longitudeDelta?: number;
      },
      zoom?: number,
    ) => {
      mapRef.current?.animateToRegion(coordinate, zoom);
    },
    [],
  );

  return {
    mapRef,
    fitToMarkers,
    flyTo,
    resetBounds,
    animateToRegion,
  };
}
