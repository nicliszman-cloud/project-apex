import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SectionTabs } from '@/components/SectionTabs';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const tabs=['Garagem','Posts','Eventos','Salvos'] as const;
type ProfileTab=typeof tabs[number];

export default function GarageScreen(){
  const {section}=useLocalSearchParams<{section?:string}>();
  const {cars,posts,events,profile,myUserId,loading,refreshRemoteData}=useApp();
  const [tab,setTab]=useState<ProfileTab>('Garagem');

  useFocusEffect(
    useCallback(()=>{
      void refreshRemoteData();
    },[refreshRemoteData])
  );

  useEffect(()=>{
    if(section && tabs.includes(section as ProfileTab)) setTab(section as ProfileTab);
  },[section]);
  const [followers,setFollowers]=useState(0);
  const [following,setFollowing]=useState(0);

  const mine=useMemo(()=>cars.filter((car)=>car.ownerId===myUserId),[cars,myUserId]);
  const myPosts=useMemo(()=>posts.filter((post)=>post.authorId===myUserId),[posts,myUserId]);
  const myEvents=useMemo(()=>events.filter((event)=>event.organizerId===myUserId),[events,myUserId]);
  const carsById=useMemo(()=>new Map(cars.map((car)=>[car.id,car])),[cars]);
  const location=[profile?.city,profile?.state].filter(Boolean).join(', ') || 'Brasil';
  const hero=mine[0]?.image || null;

  useEffect(()=>{
    async function counts(){
      if(!supabase||!myUserId) return;
      const [a,b]=await Promise.all([
        supabase.from('follows').select('follower_id',{count:'exact',head:true}).eq('following_id',myUserId),
        supabase.from('follows').select('following_id',{count:'exact',head:true}).eq('follower_id',myUserId),
      ]);
      setFollowers(a.count ?? 0);
      setFollowing(b.count ?? 0);
    }
    void counts();
  },[myUserId]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          {hero ? <AppImage uri={hero} style={StyleSheet.absoluteFill} /> : <View style={styles.coverFallback}><Ionicons name="car-sport-outline" size={54} color={theme.colors.muted2}/></View>}
          <View style={styles.coverShade}/>
          <View style={styles.topActions}>
            <Pressable style={styles.iconButton} onPress={()=>router.push('/menu')}><Ionicons name="menu-outline" size={21} color={theme.colors.text}/></Pressable>
          </View>
        </View>

        <View style={styles.identity}>
          <AppImage uri={profile?.avatarUrl} style={styles.avatar} placeholder={<Text style={styles.avatarLetter}>{(profile?.displayName||'S')[0].toUpperCase()}</Text>}/>
          <Pressable style={styles.editButton} onPress={()=>router.push('/profile-edit')}><Text style={styles.editText}>Editar perfil</Text></Pressable>
        </View>

        <View style={styles.profileBody}>
          <Text style={styles.name}>{profile?.displayName || 'StreetClub Driver'}</Text>
          <Text style={styles.handle}>{profile?.username ? '@'+profile.username : '@streetclub'} · {location}</Text>
          {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statNumber}>{myPosts.length}</Text><Text style={styles.statLabel}>posts</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>{followers}</Text><Text style={styles.statLabel}>seguidores</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>{following}</Text><Text style={styles.statLabel}>seguindo</Text></View>
          </View>
        </View>

        <View style={styles.tabsWrap}><SectionTabs items={tabs} value={tab} onChange={setTab}/></View>

        {tab==='Garagem' && <View style={styles.section}>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Minha garagem</Text><Pressable onPress={()=>router.push('/(tabs)/create')} style={styles.addButton}><Ionicons name="add" size={18} color={theme.colors.accent}/><Text style={styles.addText}>Carro</Text></Pressable></View>
          {loading ? <Empty icon="hourglass-outline" text="Carregando garagem..."/> : mine.length===0 ? <Empty icon="car-sport-outline" text="Sua garagem ainda está vazia." action="Cadastrar carro" onPress={()=>router.push('/(tabs)/create')}/> :
            <View style={styles.carGrid}>{mine.map((car)=><Pressable key={car.id} style={styles.carCard} onPress={()=>router.push('/car/'+car.id)}>
              <AppImage uri={car.image} style={styles.carImage} placeholder={<Ionicons name="car-sport-outline" size={28} color={theme.colors.muted2}/>}/>
              <View style={styles.carInfo}><Text style={styles.carName} numberOfLines={1}>{car.make} {car.model}</Text><Text style={styles.carMeta}>{car.year} · {car.currentHp} cv · {car.drivetrain}</Text></View>
            </Pressable>)}</View>}
        </View>}

        {tab==='Posts' && <View style={styles.section}>
          {myPosts.length===0 ? <Empty icon="images-outline" text="Você ainda não publicou nada." action="Criar post" onPress={()=>router.push('/(tabs)/create')}/> :
            <View style={styles.postGrid}>{myPosts.map((post)=><Pressable key={post.id} style={styles.postCell} onPress={()=>router.push('/post/'+post.id)}><AppImage uri={post.image} fallbackUri={post.carId?carsById.get(post.carId)?.image:null} style={StyleSheet.absoluteFill} placeholder={<Ionicons name="image-outline" size={24} color={theme.colors.muted2}/>}/></Pressable>)}</View>}
        </View>}

        {tab==='Eventos' && <View style={styles.section}>
          {myEvents.length===0 ? <Empty icon="calendar-outline" text="Nenhum evento criado por você." action="Criar evento" onPress={()=>router.push('/(tabs)/create')}/> :
            myEvents.map((event)=><Pressable key={event.id} style={styles.eventRow} onPress={()=>router.push('/event/'+event.id)}><AppImage uri={event.image} style={styles.eventImage}/><View style={{flex:1}}><Text style={styles.eventDate}>{event.date}</Text><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventMeta}>{event.place} · {event.city}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.colors.muted2}/></Pressable>)}
        </View>}

        {tab==='Salvos' && <View style={styles.section}><Empty icon="bookmark-outline" text="Seus itens salvos aparecerão aqui."/></View>}
      </ScrollView>
    </Screen>
  );
}

function Empty({icon,text,action,onPress}:{icon:React.ComponentProps<typeof Ionicons>['name'];text:string;action?:string;onPress?:()=>void}){
  return <View style={styles.empty}><Ionicons name={icon} size={34} color={theme.colors.muted2}/><Text style={styles.emptyText}>{text}</Text>{action&&<Pressable onPress={onPress}><Text style={styles.emptyAction}>{action}</Text></Pressable>}</View>;
}

const styles=StyleSheet.create({
  content:{paddingBottom:24},
  cover:{height:168,backgroundColor:theme.colors.surface,overflow:'hidden'},
  coverFallback:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',backgroundColor:'#0A0B0D'},
  coverShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.42)'},
  topActions:{position:'absolute',top:12,right:14,flexDirection:'row'},
  iconButton:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(5,5,6,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center'},
  identity:{paddingHorizontal:16,marginTop:-37,flexDirection:'row',alignItems:'flex-end'},
  avatar:{width:82,height:82,borderRadius:41,borderWidth:3,borderColor:theme.colors.background},
  avatarLetter:{color:theme.colors.text,fontSize:28,fontWeight:'900'},
  editButton:{marginLeft:'auto',marginBottom:5,height:36,paddingHorizontal:14,borderRadius:18,borderWidth:1,borderColor:theme.colors.borderStrong,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surface},
  editText:{color:theme.colors.text,fontSize:11,fontWeight:'900'},
  profileBody:{paddingHorizontal:16,paddingTop:10},
  name:{color:theme.colors.text,fontSize:23,fontWeight:'900'},
  handle:{color:theme.colors.muted,fontSize:11,marginTop:3},
  bio:{color:theme.colors.textSoft,fontSize:12.5,lineHeight:18,marginTop:11,maxWidth:340},
  stats:{flexDirection:'row',gap:30,marginTop:18},
  stat:{alignItems:'flex-start'},
  statNumber:{color:theme.colors.text,fontSize:17,fontWeight:'900'},
  statLabel:{color:theme.colors.muted,fontSize:10,marginTop:2},
  tabsWrap:{paddingTop:22,paddingBottom:6,borderBottomWidth:1,borderBottomColor:theme.colors.border},
  section:{paddingTop:8},
  sectionHead:{paddingHorizontal:14,paddingVertical:9,flexDirection:'row',alignItems:'center'},
  sectionTitle:{color:theme.colors.text,fontSize:16,fontWeight:'900'},
  addButton:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:4},
  addText:{color:theme.colors.accent,fontSize:11,fontWeight:'900'},
  carGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingHorizontal:14},
  carCard:{width:'48.5%',backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,overflow:'hidden'},
  carImage:{width:'100%',height:118},
  carInfo:{padding:10},
  carName:{color:theme.colors.text,fontSize:13,fontWeight:'900'},
  carMeta:{color:theme.colors.muted,fontSize:9.5,marginTop:4},
  postGrid:{flexDirection:'row',flexWrap:'wrap',gap:3,paddingHorizontal:3},
  postCell:{width:'32.7%',aspectRatio:1,backgroundColor:theme.colors.surface2},
  eventRow:{marginHorizontal:14,minHeight:82,borderBottomWidth:1,borderBottomColor:theme.colors.border,flexDirection:'row',alignItems:'center',gap:11},
  eventImage:{width:64,height:64,borderRadius:12},
  eventDate:{color:theme.colors.accent,fontSize:9,fontWeight:'900'},
  eventTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900',marginTop:3},
  eventMeta:{color:theme.colors.muted,fontSize:9.5,marginTop:3},
  empty:{margin:14,padding:28,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,alignItems:'center',backgroundColor:theme.colors.surface},
  emptyText:{color:theme.colors.muted,textAlign:'center',marginTop:9},
  emptyAction:{color:theme.colors.accent,fontWeight:'900',fontSize:12,marginTop:12},
});
