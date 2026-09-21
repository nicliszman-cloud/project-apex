import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type StreetMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
};

export type StreetMapRef = {
  centerOn: (latitude: number, longitude: number, zoom?: number) => void;
};

type Props = {
  markers?: StreetMapMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  initialCenter?: { latitude: number; longitude: number } | null;
  zoom?: number;
  onMarkerPress?: (id: string) => void;
};

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const BASE_HTML = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{height:100%;width:100%;margin:0;background:#08090B;overflow:hidden}
.leaflet-container{background:#08090B;font-family:Arial,sans-serif}
.leaflet-control-attribution{background:rgba(8,9,11,.78)!important;color:#8d929b!important;font-size:9px!important}
.leaflet-control-attribution a{color:#c7c9ce!important}
.sc-pin{width:34px;height:34px;border-radius:17px;background:#E50914;border:3px solid #36070b;box-shadow:0 2px 10px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px}
.sc-pin.selected{width:40px;height:40px;border-radius:20px;background:#ff1f2d;border-color:#5b0a11}
.sc-user{width:18px;height:18px;border-radius:9px;background:#fff;border:5px solid #E50914;box-shadow:0 0 0 5px rgba(229,9,20,.22)}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#111216;color:#fff}
.leaflet-popup-content{margin:10px 12px}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map=L.map('map',{zoomControl:false,attributionControl:true,preferCanvas:true}).setView([-24.9555,-53.4552],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'&copy; OpenStreetMap'
}).addTo(map);

const markerLayer=L.layerGroup().addTo(map);
let userMarker=null;

function eventIcon(selected){
  return L.divIcon({
    className:'',
    html:'<div class="sc-pin '+(selected?'selected':'')+'">SC</div>',
    iconSize:selected?[40,40]:[34,34],
    iconAnchor:selected?[20,20]:[17,17]
  });
}

function userIcon(){
  return L.divIcon({className:'',html:'<div class="sc-user"></div>',iconSize:[18,18],iconAnchor:[9,9]});
}

window.updateStreetClubMap=function(payload){
  markerLayer.clearLayers();
  const points=payload.markers||[];
  points.forEach(function(point){
    const marker=L.marker([point.latitude,point.longitude],{icon:eventIcon(point.id===payload.selectedId)}).addTo(markerLayer);
    marker.on('click',function(){
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:point.id}));
    });
    if(point.title){
      marker.bindPopup('<strong>'+String(point.title).replace(/[<>]/g,'')+'</strong>'+(point.subtitle?'<br><span>'+String(point.subtitle).replace(/[<>]/g,'')+'</span>':''));
    }
  });

  if(userMarker){map.removeLayer(userMarker);userMarker=null;}
  if(payload.userLocation){
    userMarker=L.marker([payload.userLocation.latitude,payload.userLocation.longitude],{icon:userIcon(),interactive:false}).addTo(map);
  }
};

window.centerStreetClubMap=function(lat,lng,zoom){
  map.setView([lat,lng],zoom||14,{animate:true});
};

window.fitStreetClubMap=function(){
  const layers=[];
  markerLayer.eachLayer(function(layer){layers.push(layer);});
  if(userMarker) layers.push(userMarker);
  if(layers.length){
    const group=L.featureGroup(layers);
    map.fitBounds(group.getBounds().pad(0.22),{maxZoom:15});
  }
};

setTimeout(function(){
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
},250);
</script>
</body>
</html>`;

export const StreetMap = forwardRef<StreetMapRef, Props>(function StreetMap({
  markers = [],
  userLocation = null,
  selectedId = null,
  initialCenter = null,
  zoom = 13,
  onMarkerPress,
}, ref) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const payload = useMemo(() => ({
    markers,
    userLocation,
    selectedId,
  }), [markers, userLocation, selectedId]);

  function pushState() {
    if (!readyRef.current) return;
    webRef.current?.injectJavaScript(
      `window.updateStreetClubMap(${safeJson(payload)});true;`
    );
  }

  useEffect(() => {
    pushState();
  }, [payload]);

  useImperativeHandle(ref, () => ({
    centerOn(latitude, longitude, nextZoom = 14) {
      webRef.current?.injectJavaScript(
        `window.centerStreetClubMap(${Number(latitude)},${Number(longitude)},${Number(nextZoom)});true;`
      );
    },
  }));

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={{ html: BASE_HTML, baseUrl: 'https://streetclub.local' }}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready') {
              readyRef.current = true;
              pushState();

              const center = initialCenter || userLocation || markers[0] || null;
              if (center) {
                webRef.current?.injectJavaScript(
                  `window.centerStreetClubMap(${Number(center.latitude)},${Number(center.longitude)},${Number(zoom)});true;`
                );
              }
              return;
            }

            if (message.type === 'marker' && message.id) onMarkerPress?.(String(message.id));
          } catch {
            // Ignore non-JSON messages.
          }
        }}
        onShouldStartLoadWithRequest={(request) => {
          return request.url.startsWith('https://')
            || request.url.startsWith('about:')
            || request.url.startsWith('data:');
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#08090B' },
  web: { flex: 1, backgroundColor: '#08090B' },
});
