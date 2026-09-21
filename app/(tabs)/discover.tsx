import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SearchBar } from '@/components/SearchBar';
import { SectionTabs } from '@/components/SectionTabs';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const modes=['Carros','Peças','Usuários','Eventos'] as const;
type Mode=typeof modes[number];
const carCategories=['Todos','JDM','Euro','Muscle','Clássicos','Track','Off-road'] as const;
type CarFilter=typeof carCategories[number];
const SWIPE=Dimensions.get('window').width*0.25;

type Listing={
  id:string;
  seller_id:string;
  title:string;
  kind:'sell'|'trade'|'wanted';
  price_cents:number|null;
  currency:string;
  image_url:string|null;
  part_category:string|null;
  city:string|null;
  state:string|null;
};

type UserCard={
  id:string;
  display_name:string|null;
  username:string|null;
  avatar_url:string|null;
  city:string|null;
  state:string|null;
};

export default function DiscoverScreen(){
  const {cars,events,swipeCar,myUserId,isDemo,loading}=useApp();
  const [mode,setMode]=useState<Mode>('Carros');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState<CarFilter>('Todos');
  const [listings,setListings]=useState<Listing[]>([]);
  const [users,setUsers]=useState<UserCard[]>([]);
  const [matchOpen,setMatchOpen]=useState(false);
  const [matchIndex,setMatchIndex]=useState(0);
  const [matched,setMatched]=useState(false);
  const [evaluated,setEvaluated]=useState<string[]>([]);
  const position=useRef(new Animated.ValueXY()).current;

  useEffect(()=>{
    async function loadAux(){
      if(!supabase || isDemo) return;
      const [listingResult,userResult,swipeResult]=await Promise.all([
        supabase.from('marketplace_listings').select('id, seller_id, title, kind, price_cents, currency, image_url, part_category, city, state').in('status',['active','reserved']).order('created_at',{ascending:false}).limit(30),
        supabase.from('profiles').select('id, display_name, username, avatar_url, city, state').neq('id',myUserId || '').limit(30),
        myUserId ? supabase.from('swipes').select('target_car_id').eq('user_id',myUserId) : Promise.resolve({data:[],error:null}),
      ]);
      if(!listingResult.error) setListings((listingResult.data ?? []) as Listing[]);
      if(!userResult.error) setUsers((userResult.data ?? []) as UserCard[]);
      setEvaluated((swipeResult.data ?? []).map((row:any)=>row.target_car_id));
    }
    void loadAux();
  },[myUserId,isDemo]);

  const q=query.trim().toLowerCase();

  const filteredCars=useMemo(()=>cars.filter((car)=>{
    if(!isDemo && car.ownerId===myUserId) return false;
    const matchesQuery=!q || [car.make,car.model,car.ownerName,car.city,car.state].join(' ').toLowerCase().includes(q);
    let matchesFilter=true;
    if(filter==='JDM'||filter==='Euro'||filter==='Muscle'||filter==='Track') matchesFilter=car.category===filter;
    if(filter==='Clássicos') matchesFilter=car.year>0&&car.year<=1999;
    if(filter==='Off-road') matchesFilter=car.tags.some((tag)=>/off.?road|4x4/i.test(tag));
    return matchesQuery&&matchesFilter;
  }),[cars,myUserId,isDemo,q,filter]);

  const filteredListings=useMemo(()=>listings.filter((item)=>!q||[item.title,item.part_category,item.city,item.state].filter(Boolean).join(' ').toLowerCase().includes(q)),[listings,q]);
  const filteredUsers=useMemo(()=>users.filter((item)=>!q||[item.display_name,item.username,item.city,item.state].filter(Boolean).join(' ').toLowerCase().includes(q)),[users,q]);
  const filteredEvents=useMemo(()=>events.filter((event)=>!q||[event.title,event.city,event.place,event.category].join(' ').toLowerCase().includes(q)),[events,q]);

  const matchCars=useMemo(()=>filteredCars.filter((car)=>isDemo||!evaluated.includes(car.id)),[filteredCars,evaluated,isDemo]);
  const matchCar=matchCars[matchIndex];

  useEffect(()=>{
    if(matchIndex>=matchCars.length && matchIndex!==0) setMatchIndex(0);
  },[matchCars.length]);

  async function completeSwipe(action:'like'|'pass'){
    if(!matchCar){position.setValue({x:0,y:0});return;}
    try{
      const isMatch=await swipeCar(matchCar.id,action);
      if(!isDemo) setEvaluated((current)=>current.includes(matchCar.id)?current:[...current,matchCar.id]);
      if(isMatch) setMatched(true);
    }catch(error:any){
      Alert.alert('Garage Match',error?.message ?? 'Não foi possível registrar a ação.');
    }
    position.setValue({x:0,y:0});
  }

  function fling(direction:'left'|'right'){
    Animated.timing(position,{toValue:{x:direction==='right'?650:-650,y:0},duration:210,useNativeDriver:true}).start(()=>{
      void completeSwipe(direction==='right'?'like':'pass');
    });
  }

  const panResponder=useMemo(()=>PanResponder.create({
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>8,
    onPanResponderMove:(_,g)=>position.setValue({x:g.dx,y:g.dy*0.15}),
    onPanResponderRelease:(_,g)=>{
      if(g.dx>SWIPE) fling('right');
      else if(g.dx<-SWIPE) fling('left');
      else Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:true}).start();
    },
  }),[matchCar?.id,isDemo]);

  const rotate=position.x.interpolate({inputRange:[-220,0,220],outputRange:['-8deg','0deg','8deg']});

  function price(item:Listing){
    if(item.kind==='trade') return 'Troca';
    if(item.kind==='wanted') return 'Procuro';
    if(item.price_cents==null) return 'Consultar';
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:item.currency||'BRL'}).format(item.price_cents/100);
  }

  const hero=filteredCars[0];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Explorar</Text>
          <Pressable style={styles.matchButton} onPress={()=>setMatchOpen(true)}>
            <Ionicons name="flame-outline" size={17} color={theme.colors.accent}/>
            <Text style={styles.matchButtonText}>Garage Match</Text>
          </Pressable>
        </View>

        <View style={styles.search}><SearchBar value={query} onChangeText={setQuery} placeholder="Buscar carros, peças, usuários, eventos..."/></View>
        <SectionTabs items={modes} value={mode} onChange={setMode}/>

        {mode==='Carros' && <>
          <View style={styles.filterWrap}><SectionTabs items={carCategories} value={filter} onChange={setFilter} compact/></View>
          {loading ? <CenterState icon="car-sport-outline" title="Carregando projetos"/> : !hero ? <CenterState icon="car-sport-outline" title="Nenhum projeto encontrado" subtitle="Tente outra categoria ou busca."/> : <>
            <Pressable style={styles.hero} onPress={()=>router.push('/car/'+hero.id)}>
              <AppImage uri={hero.image} style={StyleSheet.absoluteFill} placeholder={<Ionicons name="car-sport-outline" size={48} color={theme.colors.muted2}/>}/>
              <View style={styles.heroShade}/>
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>{hero.category.toUpperCase()}</Text>
                <Text style={styles.heroTitle}>{hero.make} {hero.model}</Text>
                <Text style={styles.heroMeta}>{hero.year} · {hero.currentHp} cv · {hero.drivetrain}</Text>
              </View>
            </Pressable>

            <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Projetos recentes</Text><Text style={styles.sectionCount}>{filteredCars.length}</Text></View>
            <View style={styles.grid}>
              {filteredCars.slice(1).map((car)=><Pressable key={car.id} style={styles.carCard} onPress={()=>router.push('/car/'+car.id)}>
                <AppImage uri={car.image} style={styles.carImage} placeholder={<Ionicons name="car-sport-outline" size={30} color={theme.colors.muted2}/>}/>
                <View style={styles.carBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{car.make} {car.model}</Text>
                  <Text style={styles.cardMeta}>{car.year} · {car.currentHp} cv</Text>
                </View>
              </Pressable>)}
            </View>
          </>}
        </>}

        {mode==='Peças' && <>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Peças e anúncios</Text><Pressable onPress={()=>router.push('/marketplace')}><Text style={styles.sectionLink}>Ver tudo</Text></Pressable></View>
          {filteredListings.length===0 ? <CenterState icon="construct-outline" title="Nenhum anúncio encontrado"/> : filteredListings.map((item)=><Pressable key={item.id} style={styles.listRow} onPress={()=>router.push('/marketplace')}>
            <AppImage uri={item.image_url} style={styles.listImage} placeholder={<Ionicons name="construct-outline" size={24} color={theme.colors.muted2}/>}/>
            <View style={styles.listInfo}><Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.listMeta}>{item.part_category || 'Peça'} · {[item.city,item.state].filter(Boolean).join(', ') || 'Brasil'}</Text></View>
            <Text style={styles.listPrice}>{price(item)}</Text>
          </Pressable>)}
        </>}

        {mode==='Usuários' && <>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Pessoas da comunidade</Text></View>
          {filteredUsers.length===0 ? <CenterState icon="people-outline" title="Nenhum usuário encontrado"/> : filteredUsers.map((user)=><Pressable key={user.id} style={styles.userRow} onPress={()=>router.push('/user/'+user.id)}>
            <AppImage uri={user.avatar_url} style={styles.userAvatar} placeholder={<Text style={styles.userLetter}>{(user.display_name||user.username||'S')[0].toUpperCase()}</Text>}/>
            <View style={{flex:1}}><Text style={styles.userName}>{user.display_name||user.username||'Driver'}</Text><Text style={styles.listMeta}>{user.username?'@'+user.username+' · ':''}{[user.city,user.state].filter(Boolean).join(', ')}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted2}/>
          </Pressable>)}
        </>}

        {mode==='Eventos' && <>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Próximos eventos</Text><Pressable onPress={()=>router.push('/(tabs)/meets')}><Text style={styles.sectionLink}>Meets</Text></Pressable></View>
          {filteredEvents.length===0 ? <CenterState icon="calendar-outline" title="Nenhum evento encontrado"/> : filteredEvents.map((event)=><Pressable key={event.id} style={styles.eventCard} onPress={()=>router.push('/event/'+event.id)}>
            <AppImage uri={event.image} style={styles.eventImage} placeholder={<Ionicons name="calendar-outline" size={34} color={theme.colors.muted2}/>}/>
            <View style={styles.eventBody}><Text style={styles.eventDate}>{event.date}</Text><Text style={styles.cardTitle}>{event.title}</Text><Text style={styles.listMeta}>{event.place} · {event.city}</Text></View>
          </Pressable>)}
        </>}
      </ScrollView>

      <Modal visible={matchOpen} transparent animationType="slide" onRequestClose={()=>setMatchOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.matchSheet}>
            <View style={styles.matchHead}>
              <View><Text style={styles.matchTitle}>Garage Match</Text><Text style={styles.matchSub}>Descubra projetos pela garagem.</Text></View>
              <Pressable onPress={()=>setMatchOpen(false)} style={styles.close}><Ionicons name="close" size={24} color={theme.colors.text}/></Pressable>
            </View>

            {matchCar ? <>
              <Animated.View {...panResponder.panHandlers} style={[styles.matchCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
                <AppImage uri={matchCar.image} style={StyleSheet.absoluteFill} placeholder={<Ionicons name="car-sport-outline" size={48} color={theme.colors.muted2}/>}/>
                <View style={styles.matchShade}/>
                <View style={styles.matchInfo}><Text style={styles.matchCarTitle}>{matchCar.make} {matchCar.model}</Text><Text style={styles.matchMeta}>{matchCar.year} · {matchCar.currentHp} cv · {matchCar.drivetrain}</Text><Text style={styles.matchOwner}>{matchCar.ownerName} · {matchCar.city}, {matchCar.state}</Text></View>
              </Animated.View>
              <View style={styles.swipeActions}>
                <Pressable style={styles.swipeSecondary} onPress={()=>fling('left')}><Ionicons name="close" size={27} color={theme.colors.danger}/></Pressable>
                <Pressable style={styles.swipeSecondary} onPress={()=>{void swipeCar(matchCar.id,'save');}}><Ionicons name="bookmark-outline" size={23} color={theme.colors.text}/></Pressable>
                <Pressable style={styles.swipePrimary} onPress={()=>fling('right')}><Ionicons name="heart" size={25} color={theme.colors.white}/></Pressable>
              </View>
            </> : <CenterState icon="checkmark-circle-outline" title="Você viu todos os projetos disponíveis" subtitle="Novos carros aparecerão aqui quando entrarem na comunidade."/>}
          </View>
        </View>
      </Modal>

      <Modal visible={matched} transparent animationType="fade">
        <View style={styles.modalCenter}><View style={styles.matchResult}><Ionicons name="flame" size={36} color={theme.colors.accent}/><Text style={styles.resultTitle}>Garage Match</Text><Text style={styles.resultText}>Vocês curtiram os projetos um do outro.</Text><PrimaryButton onPress={()=>{setMatched(false);setMatchOpen(false);router.push('/matches');}} style={{width:'100%',marginTop:20}}>Ver match</PrimaryButton><Pressable onPress={()=>setMatched(false)}><Text style={styles.keep}>Continuar explorando</Text></Pressable></View></View>
      </Modal>
    </Screen>
  );
}

function CenterState({icon,title,subtitle}:{icon:React.ComponentProps<typeof Ionicons>['name'];title:string;subtitle?:string}){
  return <View style={styles.centerState}><Ionicons name={icon} size={38} color={theme.colors.muted2}/><Text style={styles.centerTitle}>{title}</Text>{!!subtitle&&<Text style={styles.centerText}>{subtitle}</Text>}</View>;
}

const styles=StyleSheet.create({
  content:{paddingBottom:22},
  header:{height:58,paddingHorizontal:16,flexDirection:'row',alignItems:'center'},
  title:{color:theme.colors.text,fontSize:28,fontWeight:'900'},
  matchButton:{marginLeft:'auto',height:36,paddingHorizontal:12,borderRadius:18,borderWidth:1,borderColor:'#4E1116',backgroundColor:'#160709',flexDirection:'row',alignItems:'center',gap:6},
  matchButtonText:{color:theme.colors.text,fontSize:10,fontWeight:'900'},
  search:{paddingHorizontal:14,paddingBottom:12},
  filterWrap:{marginTop:10},
  hero:{height:255,margin:14,borderRadius:theme.radius.lg,overflow:'hidden',borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface},
  heroShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.38)'},
  heroContent:{position:'absolute',left:16,right:16,bottom:16},
  heroEyebrow:{color:theme.colors.accent,fontWeight:'900',fontSize:11,letterSpacing:1.8},
  heroTitle:{color:theme.colors.white,fontSize:27,fontWeight:'900',marginTop:3},
  heroMeta:{color:'#E0E1E4',fontSize:12,fontWeight:'700',marginTop:5},
  sectionHead:{paddingHorizontal:14,paddingTop:12,paddingBottom:10,flexDirection:'row',alignItems:'center'},
  sectionTitle:{color:theme.colors.text,fontSize:17,fontWeight:'900'},
  sectionCount:{color:theme.colors.muted,fontSize:11,marginLeft:8},
  sectionLink:{color:theme.colors.accent,fontSize:11,fontWeight:'900',marginLeft:'auto'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingHorizontal:14},
  carCard:{width:'48.5%',borderRadius:theme.radius.md,overflow:'hidden',borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface},
  carImage:{width:'100%',height:120},
  carBody:{padding:10},
  cardTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900'},
  cardMeta:{color:theme.colors.muted,fontSize:10,marginTop:4},
  listRow:{minHeight:82,marginHorizontal:14,borderBottomWidth:1,borderBottomColor:theme.colors.border,flexDirection:'row',alignItems:'center',paddingVertical:10},
  listImage:{width:62,height:62,borderRadius:12},
  listInfo:{flex:1,marginLeft:11},
  listTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900'},
  listMeta:{color:theme.colors.muted,fontSize:10,marginTop:4},
  listPrice:{color:theme.colors.text,fontSize:12,fontWeight:'900',marginLeft:10},
  userRow:{minHeight:70,marginHorizontal:14,borderBottomWidth:1,borderBottomColor:theme.colors.border,flexDirection:'row',alignItems:'center'},
  userAvatar:{width:46,height:46,borderRadius:23,marginRight:11},
  userLetter:{color:theme.colors.text,fontWeight:'900'},
  userName:{color:theme.colors.text,fontWeight:'900',fontSize:13},
  eventCard:{marginHorizontal:14,marginBottom:12,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,overflow:'hidden',backgroundColor:theme.colors.surface,flexDirection:'row'},
  eventImage:{width:112,height:98},
  eventBody:{flex:1,padding:12},
  eventDate:{color:theme.colors.accent,fontSize:9,fontWeight:'900',marginBottom:4},
  centerState:{margin:18,padding:32,alignItems:'center',borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,backgroundColor:theme.colors.surface},
  centerTitle:{color:theme.colors.text,fontSize:17,fontWeight:'900',textAlign:'center',marginTop:10},
  centerText:{color:theme.colors.muted,textAlign:'center',lineHeight:18,marginTop:6},
  modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.82)',justifyContent:'flex-end'},
  matchSheet:{backgroundColor:theme.colors.backgroundSoft,borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:theme.colors.border,padding:16,paddingBottom:26},
  matchHead:{flexDirection:'row',alignItems:'center',marginBottom:14},
  matchTitle:{color:theme.colors.text,fontSize:23,fontWeight:'900'},
  matchSub:{color:theme.colors.muted,fontSize:11,marginTop:3},
  close:{marginLeft:'auto',width:38,height:38,borderRadius:19,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center'},
  matchCard:{height:430,borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:theme.colors.border},
  matchShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.28)'},
  matchInfo:{position:'absolute',left:18,right:18,bottom:18},
  matchCarTitle:{color:theme.colors.white,fontSize:27,fontWeight:'900'},
  matchMeta:{color:'#E3E4E6',fontSize:12,fontWeight:'800',marginTop:5},
  matchOwner:{color:'#C1C3C7',fontSize:10,marginTop:5},
  swipeActions:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,marginTop:16},
  swipeSecondary:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,alignItems:'center',justifyContent:'center'},
  swipePrimary:{width:62,height:62,borderRadius:31,backgroundColor:theme.colors.accent,alignItems:'center',justifyContent:'center'},
  modalCenter:{flex:1,backgroundColor:'rgba(0,0,0,.85)',justifyContent:'center',padding:24},
  matchResult:{padding:26,borderRadius:22,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,alignItems:'center'},
  resultTitle:{color:theme.colors.text,fontSize:26,fontWeight:'900',marginTop:10},
  resultText:{color:theme.colors.muted,textAlign:'center',marginTop:6},
  keep:{color:theme.colors.textSoft,fontSize:12,fontWeight:'800',marginTop:16},
});
