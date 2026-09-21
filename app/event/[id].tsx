import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function EventDetailScreen(){
  const {id}=useLocalSearchParams<{id:string}>();
  const {events,myUserId,toggleEvent,refreshRemoteData}=useApp();
  const event=events.find((item)=>item.id===id);
  const mine=event?.organizerId===myUserId;
  const [editing,setEditing]=useState(false);
  const [title,setTitle]=useState(event?.title||'');
  const [description,setDescription]=useState(event?.description||'');

  async function save(){if(!supabase||!event||!mine)return;const {error}=await supabase.from('events').update({title:title.trim(),description:description.trim()||null}).eq('id',event.id);if(error)return Alert.alert('Editar evento',error.message);await refreshRemoteData();setEditing(false)}
  function remove(){if(!supabase||!event||!mine)return;Alert.alert('Excluir evento','Essa ação não pode ser desfeita.',[{text:'Cancelar',style:'cancel'},{text:'Excluir',style:'destructive',onPress:async()=>{const {error}=await supabase!.from('events').delete().eq('id',event.id);if(error)return Alert.alert('Erro',error.message);await refreshRemoteData();router.replace('/(tabs)/meets')}}])}

  if(!event)return <Screen><View style={styles.center}><Text style={styles.muted}>Evento não encontrado.</Text></View></Screen>;

  return <Screen><ScrollView showsVerticalScrollIndicator={false}><View style={styles.heroWrap}><AppImage uri={event.image} style={styles.hero} placeholder={<Ionicons name="calendar-outline" size={44} color={theme.colors.muted2}/>}/><View style={styles.shade}/><Pressable style={styles.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={22} color={theme.colors.white}/></Pressable><View style={styles.heroText}><Text style={styles.category}>{event.category.toUpperCase()}</Text>{!editing&&<Text style={styles.heroTitle}>{event.title}</Text>}</View></View><View style={styles.body}>
    {editing?<><TextInput style={styles.titleInput} value={title} onChangeText={setTitle}/><TextInput style={styles.descriptionInput} value={description} onChangeText={setDescription} multiline placeholder="Descrição" placeholderTextColor={theme.colors.muted}/></>:!!event.description&&<Text style={styles.description}>{event.description}</Text>}
    <View style={styles.infoCard}><Info icon="calendar-outline" label="Data" value={event.date}/><Info icon="location-outline" label="Local" value={event.place+' · '+event.city}/><Info icon="people-outline" label="Confirmados" value={String(event.attendees)}/></View>
    <PrimaryButton onPress={()=>{void toggleEvent(event.id)}} style={[styles.join,event.joined&&styles.joined]}>{event.joined?'Presença confirmada':'Confirmar presença'}</PrimaryButton>
    <Pressable style={styles.mapButton} onPress={()=>router.push('/meets-map')}><Ionicons name="map-outline" size={18} color={theme.colors.text}/><Text style={styles.mapText}>Ver no mapa</Text></Pressable>
    {mine&&<View style={styles.ownerActions}>{editing?<><Pressable style={styles.secondary} onPress={()=>setEditing(false)}><Text style={styles.secondaryText}>Cancelar</Text></Pressable><Pressable style={styles.primary} onPress={()=>{void save()}}><Text style={styles.primaryText}>Salvar</Text></Pressable></>:<><Pressable style={styles.secondary} onPress={()=>setEditing(true)}><Ionicons name="create-outline" size={17} color={theme.colors.text}/><Text style={styles.secondaryText}>Editar</Text></Pressable><Pressable style={styles.delete} onPress={remove}><Ionicons name="trash-outline" size={18} color={theme.colors.danger}/></Pressable></>}</View>}
  </View></ScrollView></Screen>
}

function Info({icon,label,value}:{icon:React.ComponentProps<typeof Ionicons>['name'];label:string;value:string}){return <View style={styles.infoRow}><Ionicons name={icon} size={18} color={theme.colors.accent}/><View style={{flex:1}}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>}

const styles=StyleSheet.create({
  heroWrap:{height:320,backgroundColor:theme.colors.surface,overflow:'hidden'},
  hero:{width:'100%',height:'100%'},
  shade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.34)'},
  back:{position:'absolute',top:14,left:14,width:40,height:40,borderRadius:20,backgroundColor:'rgba(5,5,6,.72)',alignItems:'center',justifyContent:'center'},
  heroText:{position:'absolute',left:18,right:18,bottom:18},
  category:{color:theme.colors.accent,fontSize:10,fontWeight:'900',letterSpacing:1.2},
  heroTitle:{color:theme.colors.white,fontSize:29,fontWeight:'900',marginTop:5},
  body:{padding:16,paddingBottom:34},
  description:{color:theme.colors.textSoft,fontSize:12.5,lineHeight:19},
  infoCard:{marginTop:18,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,backgroundColor:theme.colors.surface,overflow:'hidden'},
  infoRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:13,borderBottomWidth:1,borderBottomColor:theme.colors.border},
  infoLabel:{color:theme.colors.muted,fontSize:9.5},
  infoValue:{color:theme.colors.text,fontSize:11.5,fontWeight:'800',marginTop:2},
  join:{marginTop:18},
  joined:{backgroundColor:'#173D2D'},
  mapButton:{height:46,borderRadius:theme.radius.md,borderWidth:1,borderColor:theme.colors.border,marginTop:9,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  mapText:{color:theme.colors.text,fontSize:11,fontWeight:'900'},
  ownerActions:{flexDirection:'row',gap:9,marginTop:18},
  secondary:{flex:1,height:46,borderRadius:theme.radius.md,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},
  secondaryText:{color:theme.colors.text,fontWeight:'900',fontSize:11},
  primary:{flex:1,height:46,borderRadius:theme.radius.md,backgroundColor:theme.colors.accent,alignItems:'center',justifyContent:'center'},
  primaryText:{color:theme.colors.white,fontWeight:'900',fontSize:11},
  delete:{width:46,height:46,borderRadius:theme.radius.md,borderWidth:1,borderColor:'#572026',alignItems:'center',justifyContent:'center'},
  titleInput:{color:theme.colors.text,fontSize:22,fontWeight:'900',backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,padding:12},
  descriptionInput:{color:theme.colors.text,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,padding:12,minHeight:110,marginTop:10,textAlignVertical:'top'},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  muted:{color:theme.colors.muted},
});
