import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

const pinPositions=[
  {left:'18%',top:'28%'},{left:'48%',top:'18%'},{left:'72%',top:'34%'},{left:'34%',top:'52%'},{left:'62%',top:'58%'},{left:'22%',top:'70%'},
] as const;

export default function MeetsMapScreen(){
  const {events}=useApp();
  const [selectedId,setSelectedId]=useState(events[0]?.id || '');
  const selected=useMemo(()=>events.find((item)=>item.id===selectedId) || events[0],[events,selectedId]);

  return <Screen><View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.colors.text}/></Pressable><Text style={styles.title}>Mapa</Text><Pressable style={styles.search}><Ionicons name="search-outline" size={20} color={theme.colors.text}/></Pressable></View><View style={styles.map}>
    <View style={[styles.road,{top:'20%',transform:[{rotate:'12deg'}]}]}/><View style={[styles.road,{top:'45%',transform:[{rotate:'-8deg'}]}]}/><View style={[styles.road,{top:'67%',transform:[{rotate:'16deg'}]}]}/><View style={[styles.verticalRoad,{left:'28%',transform:[{rotate:'8deg'}]}]}/><View style={[styles.verticalRoad,{left:'67%',transform:[{rotate:'-12deg'}]}]}/>
    {events.slice(0,pinPositions.length).map((event,index)=><Pressable key={event.id} onPress={()=>setSelectedId(event.id)} style={[styles.pin,pinPositions[index],selectedId===event.id&&styles.pinActive]}><Ionicons name="location" size={21} color={theme.colors.white}/></Pressable>)}
    {!events.length&&<View style={styles.mapEmpty}><Ionicons name="map-outline" size={42} color={theme.colors.muted2}/><Text style={styles.mapEmptyText}>Os eventos aparecerão aqui.</Text></View>}
    {selected&&<Pressable style={styles.eventCard} onPress={()=>router.push('/event/'+selected.id)}><AppImage uri={selected.image} style={styles.eventImage}/><View style={styles.eventInfo}><Text style={styles.eventTitle}>{selected.title}</Text><Text style={styles.eventMeta}>{selected.date}</Text><Text style={styles.eventMeta}>{selected.place} · {selected.city}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.colors.muted2}/></Pressable>}
  </View></Screen>
}

const styles=StyleSheet.create({
  header:{height:58,paddingHorizontal:12,flexDirection:'row',alignItems:'center'},
  back:{width:40,height:40,alignItems:'center',justifyContent:'center'},
  title:{color:theme.colors.text,fontSize:20,fontWeight:'900',marginLeft:4},
  search:{marginLeft:'auto',width:40,height:40,alignItems:'center',justifyContent:'center'},
  map:{flex:1,backgroundColor:'#0B0C0E',overflow:'hidden'},
  road:{position:'absolute',left:'-10%',width:'120%',height:2,backgroundColor:'#23252A'},
  verticalRoad:{position:'absolute',top:'-10%',height:'120%',width:2,backgroundColor:'#23252A'},
  pin:{position:'absolute',width:38,height:38,borderRadius:19,backgroundColor:'#84101A',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#190609'},
  pinActive:{backgroundColor:theme.colors.accent,transform:[{scale:1.12}]},
  mapEmpty:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center'},
  mapEmptyText:{color:theme.colors.muted,marginTop:8},
  eventCard:{position:'absolute',left:14,right:14,bottom:16,minHeight:92,borderRadius:theme.radius.lg,borderWidth:1,borderColor:theme.colors.border,backgroundColor:'rgba(16,17,20,.96)',flexDirection:'row',alignItems:'center',padding:10},
  eventImage:{width:72,height:72,borderRadius:12},
  eventInfo:{flex:1,marginLeft:11},
  eventTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900'},
  eventMeta:{color:theme.colors.muted,fontSize:9.5,marginTop:4},
});
