import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { StreetMap, StreetMapMarker, StreetMapRef } from '@/components/StreetMap';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type EventCoordinate={id:string;latitude:number;longitude:number};

export default function MeetsMapScreen(){
  const {events}=useApp();
  const mapRef=useRef<StreetMapRef>(null);
  const attempted=useRef(new Set<string>());
  const [coords,setCoords]=useState<EventCoordinate[]>([]);
  const [selectedId,setSelectedId]=useState('');
  const [userLocation,setUserLocation]=useState<{latitude:number;longitude:number}|null>(null);
  const [allowed,setAllowed]=useState(false);
  const [loadingLocation,setLoadingLocation]=useState(true);

  const selected=useMemo(()=>events.find((event)=>event.id===selectedId)||null,[events,selectedId]);

  useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      const {data,error}=await supabase.from('events').select('id, latitude, longitude');
      if(!active)return;
      if(error){
        const missing=error.code==='42703'||error.code==='PGRST204'||/latitude|longitude/i.test(error.message||'');
        if(!missing) console.warn('StreetClub map:',error.message);
        return;
      }
      setCoords((data??[]).filter((row:any)=>Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)).map((row:any)=>({
        id:row.id,latitude:Number(row.latitude),longitude:Number(row.longitude)
      })));
    }
    void load();
    const timer=setInterval(()=>{void load()},15000);
    return()=>{active=false;clearInterval(timer)};
  },[]);

  useEffect(()=>{
    let sub:Location.LocationSubscription|null=null;
    let active=true;
    async function start(){
      try{
        const permission=await Location.requestForegroundPermissionsAsync();
        if(!active)return;
        if(permission.status!=='granted'){setAllowed(false);return}
        setAllowed(true);

        const current=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
        if(active){
          const next={latitude:current.coords.latitude,longitude:current.coords.longitude};
          setUserLocation(next);
          mapRef.current?.centerOn(next.latitude,next.longitude,13);
        }

        sub=await Location.watchPositionAsync(
          {accuracy:Location.Accuracy.Balanced,timeInterval:5000,distanceInterval:15},
          (position)=>active&&setUserLocation({latitude:position.coords.latitude,longitude:position.coords.longitude})
        );
      }catch(error:any){
        if(active)Alert.alert('Localização',error?.message??'Não foi possível obter sua localização.');
      }finally{
        if(active)setLoadingLocation(false);
      }
    }
    void start();
    return()=>{active=false;sub?.remove()};
  },[]);

  useEffect(()=>{
    if(!allowed)return;
    let active=true;
    async function geocodeMissing(){
      const missing=events
        .filter((event)=>!coords.some((item)=>item.id===event.id))
        .filter((event)=>!attempted.current.has(event.id))
        .slice(0,12);

      for(const event of missing){
        attempted.current.add(event.id);
        try{
          const address=[event.place,event.city.replace(/•/g,','),'Brasil'].filter(Boolean).join(', ');
          const result=await Location.geocodeAsync(address);
          if(!active||!result[0])continue;
          const found={id:event.id,latitude:result[0].latitude,longitude:result[0].longitude};
          setCoords((current)=>current.some((item)=>item.id===event.id)?current:[...current,found]);

          if(supabase){
            const update=await supabase.from('events').update({latitude:found.latitude,longitude:found.longitude}).eq('id',event.id);
            if(update.error && !['42703','PGRST204'].includes(update.error.code||'')){
              console.warn('StreetClub event coordinates:',update.error.message);
            }
          }
        }catch{}
      }
    }
    void geocodeMissing();
    return()=>{active=false};
  },[allowed,events,coords]);

  const markers=useMemo<StreetMapMarker[]>(()=>coords.map((coordinate)=>{
    const event=events.find((item)=>item.id===coordinate.id);
    return {
      id:coordinate.id,
      latitude:coordinate.latitude,
      longitude:coordinate.longitude,
      title:event?.title||'StreetClub Meet',
      subtitle:event?[event.place,event.city].filter(Boolean).join(' · '):undefined,
    };
  }).filter((item)=>events.some((event)=>event.id===item.id)),[coords,events]);

  function centerUser(){
    if(!userLocation){
      Alert.alert('Localização',allowed?'Aguardando a posição do aparelho.':'Permita acesso à localização para centralizar o mapa.');
      return;
    }
    mapRef.current?.centerOn(userLocation.latitude,userLocation.longitude,14);
  }

  return <Screen>
    <View style={styles.header}>
      <Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.colors.text}/></Pressable>
      <View style={{flex:1}}><Text style={styles.title}>Mapa</Text><Text style={styles.sub}>OpenStreetMap · meets e localização</Text></View>
      <Pressable onPress={centerUser} style={styles.locate}><Ionicons name={loadingLocation?'hourglass-outline':'navigate'} size={19} color={theme.colors.accent}/></Pressable>
    </View>

    <View style={styles.map}>
      <StreetMap
        ref={mapRef}
        markers={markers}
        userLocation={userLocation}
        selectedId={selectedId}
        initialCenter={userLocation||markers[0]||{latitude:-24.9555,longitude:-53.4552}}
        zoom={userLocation||markers[0]?13:11}
        onMarkerPress={setSelectedId}
      />

      {!allowed&&!loadingLocation&&<View style={styles.banner}><Ionicons name="location-outline" size={17} color={theme.colors.accent}/><Text style={styles.bannerText}>Permita localização para ver sua posição. Os eventos continuam visíveis pelo endereço.</Text></View>}

      {markers.length===0&&<View pointerEvents="none" style={styles.empty}><Text style={styles.emptyText}>Os eventos serão posicionados pelo endereço mesmo sem Google Maps.</Text></View>}

      {!!selected&&<Pressable style={styles.card} onPress={()=>router.push('/event/'+selected.id)}>
        <AppImage uri={selected.image} style={styles.image}/>
        <View style={styles.copy}><Text style={styles.kicker}>{selected.category.toUpperCase()}</Text><Text style={styles.eventTitle} numberOfLines={1}>{selected.title}</Text><Text style={styles.meta} numberOfLines={1}>{selected.date}</Text><Text style={styles.meta} numberOfLines={1}>{selected.place} · {selected.city}</Text></View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.muted2}/>
      </Pressable>}
    </View>
  </Screen>
}

const styles=StyleSheet.create({
  header:{minHeight:62,paddingHorizontal:12,flexDirection:'row',alignItems:'center',backgroundColor:theme.colors.background},
  back:{width:40,height:40,alignItems:'center',justifyContent:'center',marginRight:3},
  title:{color:theme.colors.text,fontSize:20,fontWeight:'900'},
  sub:{color:theme.colors.muted,fontSize:9.5,marginTop:2},
  locate:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,alignItems:'center',justifyContent:'center'},
  map:{flex:1,backgroundColor:'#08090B'},
  banner:{position:'absolute',top:12,left:12,right:12,minHeight:46,borderRadius:14,backgroundColor:'rgba(8,9,11,.94)',borderWidth:1,borderColor:theme.colors.border,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:8},
  bannerText:{color:theme.colors.textSoft,fontSize:10.5,flex:1},
  empty:{position:'absolute',top:70,left:18,right:18,alignItems:'center'},
  emptyText:{color:theme.colors.muted,fontSize:10,textAlign:'center',backgroundColor:'rgba(8,9,11,.82)',paddingHorizontal:12,paddingVertical:8,borderRadius:12},
  card:{position:'absolute',left:14,right:14,bottom:16,minHeight:96,borderRadius:theme.radius.lg,borderWidth:1,borderColor:theme.colors.border,backgroundColor:'rgba(16,17,20,.97)',flexDirection:'row',alignItems:'center',padding:10},
  image:{width:74,height:74,borderRadius:12},
  copy:{flex:1,marginLeft:11},
  kicker:{color:theme.colors.accent,fontSize:8,fontWeight:'900',letterSpacing:1},
  eventTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900',marginTop:3},
  meta:{color:theme.colors.muted,fontSize:9.5,marginTop:3},
});
