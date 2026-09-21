import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SectionTabs } from '@/components/SectionTabs';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

const filters=['Próximos','Track','JDM','Euro','Outros'] as const;
type Filter=typeof filters[number];

export default function MeetsScreen(){
  const {events,toggleEvent}=useApp();
  const [filter,setFilter]=useState<Filter>('Próximos');

  const visible=useMemo(()=>events.filter((event)=>{
    if(filter==='Próximos') return true;
    if(filter==='Outros') return !['Track','JDM','Euro'].some((value)=>event.category.toLowerCase().includes(value.toLowerCase()));
    return event.category.toLowerCase().includes(filter.toLowerCase());
  }),[events,filter]);

  async function attendance(id:string){
    try{await toggleEvent(id)}catch(error:any){Alert.alert('Evento',error?.message ?? 'Não foi possível atualizar sua presença.')}
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.title}>Meets</Text><Text style={styles.sub}>A comunidade fora da tela.</Text></View><View style={styles.headerActions}><Pressable style={styles.iconButton} onPress={()=>router.push('/meets-map')}><Ionicons name="map-outline" size={20} color={theme.colors.text}/></Pressable><Pressable style={styles.create} onPress={()=>router.push('/(tabs)/create')}><Ionicons name="add" size={21} color={theme.colors.white}/></Pressable></View></View>
        <SectionTabs items={filters} value={filter} onChange={setFilter}/>

        {visible.length===0?<View style={styles.empty}><Ionicons name="calendar-outline" size={38} color={theme.colors.muted2}/><Text style={styles.emptyTitle}>Nenhum evento por aqui</Text><Text style={styles.emptyText}>Crie um encontro ou escolha outro filtro.</Text></View>:
          <View style={styles.list}>{visible.map((item,index)=><Pressable key={item.id} style={styles.card} onPress={()=>router.push('/event/'+item.id)}>
            <View style={styles.photoWrap}><AppImage uri={item.image} style={StyleSheet.absoluteFill} placeholder={<Ionicons name="calendar-outline" size={40} color={theme.colors.muted2}/>}/><View style={styles.shade}/><View style={styles.dateBadge}><Text style={styles.dateDay}>{item.date.split(' ')[0]}</Text><Text style={styles.dateMonth}>{item.date.split(' ')[1]||''}</Text></View></View>
            <View style={styles.body}><Text style={styles.category}>{item.category.toUpperCase()}</Text><Text style={styles.eventTitle}>{item.title}</Text><View style={styles.metaRow}><Ionicons name="time-outline" size={14} color={theme.colors.muted}/><Text style={styles.meta}>{item.date}</Text></View><View style={styles.metaRow}><Ionicons name="location-outline" size={14} color={theme.colors.muted}/><Text style={styles.meta}>{item.place} · {item.city}</Text></View>{!!item.description&&<Text style={styles.description} numberOfLines={2}>{item.description}</Text>}<View style={styles.footer}><Text style={styles.people}>{item.attendees} confirmados</Text><Pressable style={[styles.join,item.joined&&styles.joined]} onPress={(event)=>{event.stopPropagation();void attendance(item.id)}}><Text style={styles.joinText}>{item.joined?'Confirmado':'Eu vou'}</Text></Pressable></View></View>
          </Pressable>)}</View>
        }
      </ScrollView>
    </Screen>
  );
}

const styles=StyleSheet.create({
  content:{paddingBottom:24},
  header:{height:64,paddingHorizontal:16,flexDirection:'row',alignItems:'center'},
  title:{color:theme.colors.text,fontSize:29,fontWeight:'900'},
  sub:{color:theme.colors.muted,fontSize:11,marginTop:2},
  headerActions:{marginLeft:'auto',flexDirection:'row',gap:8},
  iconButton:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surface},
  create:{width:40,height:40,borderRadius:20,backgroundColor:theme.colors.accent,alignItems:'center',justifyContent:'center'},
  list:{padding:14,gap:13},
  card:{borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,overflow:'hidden',backgroundColor:theme.colors.surface},
  photoWrap:{height:185,backgroundColor:theme.colors.surface2},
  shade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.20)'},
  dateBadge:{position:'absolute',left:12,top:12,width:48,minHeight:52,borderRadius:12,backgroundColor:'rgba(5,5,6,.84)',borderWidth:1,borderColor:'rgba(255,255,255,.13)',alignItems:'center',justifyContent:'center'},
  dateDay:{color:theme.colors.text,fontSize:16,fontWeight:'900'},
  dateMonth:{color:theme.colors.accent,fontSize:8,fontWeight:'900',marginTop:2,textTransform:'uppercase'},
  body:{padding:14},
  category:{color:theme.colors.accent,fontSize:9,fontWeight:'900',letterSpacing:1.1},
  eventTitle:{color:theme.colors.text,fontSize:19,fontWeight:'900',marginTop:4,marginBottom:8},
  metaRow:{flexDirection:'row',alignItems:'center',gap:6,marginTop:4},
  meta:{color:theme.colors.muted,fontSize:10.5,flex:1},
  description:{color:theme.colors.textSoft,fontSize:11.5,lineHeight:17,marginTop:9},
  footer:{flexDirection:'row',alignItems:'center',marginTop:14},
  people:{color:theme.colors.textSoft,fontSize:10.5,fontWeight:'700'},
  join:{marginLeft:'auto',height:34,paddingHorizontal:13,borderRadius:17,backgroundColor:theme.colors.accent,alignItems:'center',justifyContent:'center'},
  joined:{backgroundColor:'#163B2C'},
  joinText:{color:theme.colors.white,fontSize:10,fontWeight:'900'},
  empty:{margin:18,padding:30,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,alignItems:'center',backgroundColor:theme.colors.surface},
  emptyTitle:{color:theme.colors.text,fontSize:18,fontWeight:'900',marginTop:10},
  emptyText:{color:theme.colors.muted,textAlign:'center',marginTop:6},
});
