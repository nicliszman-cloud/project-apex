import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { openConversation } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const WIDTH=Dimensions.get('window').width;
const modGroups=['Motor','Turbo','Escape','Suspensão','Rodas/Pneus','Freios','Exterior','Interior','Eletrônica'] as const;

function groupModification(value:string){
  const text=value.toLowerCase();
  if(/turbo|intercooler|wastegate|boost/.test(text)) return 'Turbo';
  if(/escape|exhaust|downpipe|muffler/.test(text)) return 'Escape';
  if(/suspens|coilover|mola|amortec/.test(text)) return 'Suspensão';
  if(/roda|pneu|wheel|tire|aro/.test(text)) return 'Rodas/Pneus';
  if(/freio|brake|brembo|disco/.test(text)) return 'Freios';
  if(/aero|spoiler|lip|body|parachoque|capô|hood|exterior/.test(text)) return 'Exterior';
  if(/banco|volante|interior|seat|steering/.test(text)) return 'Interior';
  if(/ecu|fueltech|injeção|eletr|sensor|piggy/.test(text)) return 'Eletrônica';
  return 'Motor';
}

export default function CarProfileScreen(){
  const {id}=useLocalSearchParams<{id:string}>();
  const {cars,myUserId,refreshRemoteData}=useApp();
  const car=cars.find((item)=>item.id===id);
  if(!car) return <Screen><View style={styles.center}><Ionicons name="car-sport-outline" size={38} color={theme.colors.muted2}/><Text style={styles.centerText}>Projeto não encontrado.</Text></View></Screen>;

  const gallery=car.images?.length?car.images:[car.image];
  const ownerId=car.ownerId;
  const carId=car.id;
  const mine=ownerId===myUserId;
  const grouped=new Map<string,string[]>();
  for(const group of modGroups) grouped.set(group,[]);
  for(const modification of car.modifications){
    const group=groupModification(modification);
    grouped.get(group)?.push(modification);
  }

  async function messageOwner(){
    if(mine) return;
    try{
      const conversationId=await openConversation(ownerId);
      router.push({pathname:'/chat',params:{conversationId}});
    }catch(error:any){
      Alert.alert('Mensagem',error?.message ?? 'Não foi possível abrir a conversa.');
    }
  }

  function remove(){
    if(!supabase||!mine) return;
    Alert.alert('Excluir carro','Essa ação remove o projeto e os dados vinculados.',[
      {text:'Cancelar',style:'cancel'},
      {text:'Excluir',style:'destructive',onPress:async()=>{
        const {error}=await supabase!.from('cars').delete().eq('id',carId);
        if(error) return Alert.alert('Erro',error.message);
        await refreshRemoteData();
        router.replace('/(tabs)/garage');
      }},
    ]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryWrap}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {gallery.map((image,index)=><AppImage key={image+index} uri={image} style={styles.hero} placeholder={<Ionicons name="car-sport-outline" size={48} color={theme.colors.muted2}/>}/>)}
          </ScrollView>
          <View style={styles.heroShade}/>
          <Pressable style={styles.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={24} color={theme.colors.white}/></Pressable>
          <View style={styles.photoCount}><Ionicons name="images-outline" size={14} color={theme.colors.white}/><Text style={styles.photoCountText}>{gallery.length}</Text></View>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>{car.category.toUpperCase()} · {car.city}, {car.state}</Text>
            <Text style={styles.title}>{car.make} {car.model}</Text>
            {!!car.version&&<Text style={styles.version}>{car.version}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          <Pressable style={styles.ownerRow} onPress={()=>router.push('/user/'+car.ownerId)}>
            <AppImage uri={car.ownerAvatar.startsWith('http')?car.ownerAvatar:null} style={styles.ownerAvatar} placeholder={<Text style={styles.ownerLetter}>{car.ownerName[0]}</Text>}/>
            <View style={{flex:1}}><Text style={styles.ownerName}>{car.ownerName}</Text><Text style={styles.ownerMeta}>Dono do projeto</Text></View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted2}/>
          </Pressable>

          {!mine&&<PrimaryButton onPress={()=>{void messageOwner();}} style={styles.messageButton}>Mensagem para o proprietário</PrimaryButton>}

          <View style={styles.metrics}>
            <Metric value={String(car.year)} label="ANO"/>
            <Metric value={String(car.currentHp)} label="CV"/>
            <Metric value={car.drivetrain} label="TRAÇÃO"/>
          </View>

          {!!car.description&&<><Text style={styles.sectionTitle}>Sobre o projeto</Text><Text style={styles.description}>{car.description}</Text></>}

          <Text style={styles.sectionTitle}>Ficha técnica</Text>
          <View style={styles.specCard}>
            <Spec icon="construct-outline" label="Motor" value={car.engine}/>
            <Spec icon="git-compare-outline" label="Câmbio" value={car.transmission}/>
            <Spec icon="water-outline" label="Combustível" value={car.fuel || 'Não informado'}/>
            <Spec icon="speedometer-outline" label="Potência original" value={car.stockHp+' cv'}/>
            <Spec icon="flash-outline" label="Potência atual" value={car.currentHp+' cv'}/>
          </View>

          <Text style={styles.sectionTitle}>Modificações</Text>
          {car.modifications.length===0?<View style={styles.emptyMods}><Ionicons name="construct-outline" size={28} color={theme.colors.muted2}/><Text style={styles.emptyText}>Nenhuma modificação cadastrada.</Text></View>:
            modGroups.map((group)=>{
              const values=grouped.get(group) || [];
              if(!values.length) return null;
              return <View key={group} style={styles.modGroup}><Text style={styles.modGroupTitle}>{group}</Text>{values.map((item)=><View key={item} style={styles.modRow}><View style={styles.redDot}/><Text style={styles.modText}>{item}</Text></View>)}</View>;
            })
          }

          {mine&&<View style={styles.ownerActions}>
            <Pressable style={styles.editButton} onPress={()=>router.push('/car-edit/'+car.id)}><Ionicons name="create-outline" size={18} color={theme.colors.white}/><Text style={styles.editText}>Editar projeto</Text></Pressable>
            <Pressable style={styles.deleteButton} onPress={remove}><Ionicons name="trash-outline" size={18} color={theme.colors.danger}/></Pressable>
          </View>}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({value,label}:{value:string;label:string}){return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>}
function Spec({icon,label,value}:{icon:React.ComponentProps<typeof Ionicons>['name'];label:string;value:string}){return <View style={styles.spec}><Ionicons name={icon} size={17} color={theme.colors.muted}/><Text style={styles.specLabel}>{label}</Text><Text style={styles.specValue}>{value}</Text></View>}

const styles=StyleSheet.create({
  galleryWrap:{height:365,backgroundColor:theme.colors.surface,overflow:'hidden'},
  hero:{width:WIDTH,height:365},
  heroShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.28)'},
  back:{position:'absolute',top:14,left:14,width:40,height:40,borderRadius:20,backgroundColor:'rgba(5,5,6,.72)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.12)'},
  photoCount:{position:'absolute',top:16,right:14,flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'rgba(5,5,6,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.12)',borderRadius:18,paddingHorizontal:10,height:34},
  photoCountText:{color:theme.colors.white,fontSize:11,fontWeight:'800'},
  heroText:{position:'absolute',left:18,right:18,bottom:18},
  kicker:{color:theme.colors.accent,fontSize:10,fontWeight:'900',letterSpacing:1.2},
  title:{color:theme.colors.white,fontSize:31,fontWeight:'900',marginTop:4},
  version:{color:'#D8D9DD',fontSize:12,marginTop:4},
  body:{padding:16,paddingBottom:34},
  ownerRow:{flexDirection:'row',alignItems:'center',paddingVertical:10},
  ownerAvatar:{width:42,height:42,borderRadius:21},
  ownerLetter:{color:theme.colors.text,fontWeight:'900'},
  ownerName:{color:theme.colors.text,fontSize:13,fontWeight:'900',marginLeft:10},
  ownerMeta:{color:theme.colors.muted,fontSize:9.5,marginLeft:10,marginTop:2},
  messageButton:{marginTop:8},
  metrics:{flexDirection:'row',backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,marginTop:16},
  metric:{flex:1,alignItems:'center',paddingVertical:15,borderRightWidth:1,borderRightColor:theme.colors.border},
  metricValue:{color:theme.colors.text,fontSize:17,fontWeight:'900'},
  metricLabel:{color:theme.colors.muted,fontSize:8.5,fontWeight:'800',marginTop:3,letterSpacing:.8},
  sectionTitle:{color:theme.colors.text,fontSize:18,fontWeight:'900',marginTop:24,marginBottom:10},
  description:{color:theme.colors.textSoft,fontSize:12.5,lineHeight:19},
  specCard:{borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,backgroundColor:theme.colors.surface,overflow:'hidden'},
  spec:{minHeight:48,flexDirection:'row',alignItems:'center',paddingHorizontal:13,borderBottomWidth:1,borderBottomColor:theme.colors.border,gap:9},
  specLabel:{color:theme.colors.muted,fontSize:11},
  specValue:{color:theme.colors.text,fontSize:11,fontWeight:'800',marginLeft:'auto',maxWidth:'52%',textAlign:'right'},
  modGroup:{marginBottom:14,borderLeftWidth:2,borderLeftColor:theme.colors.accent,paddingLeft:12},
  modGroupTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900',marginBottom:6},
  modRow:{flexDirection:'row',alignItems:'flex-start',gap:8,paddingVertical:4},
  redDot:{width:5,height:5,borderRadius:3,backgroundColor:theme.colors.accent,marginTop:7},
  modText:{color:theme.colors.textSoft,fontSize:12,lineHeight:18,flex:1},
  emptyMods:{padding:24,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,alignItems:'center',backgroundColor:theme.colors.surface},
  emptyText:{color:theme.colors.muted,marginTop:8},
  ownerActions:{flexDirection:'row',gap:9,marginTop:26},
  editButton:{flex:1,minHeight:48,borderRadius:theme.radius.md,backgroundColor:theme.colors.accent,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},
  editText:{color:theme.colors.white,fontWeight:'900'},
  deleteButton:{width:48,height:48,borderRadius:theme.radius.md,borderWidth:1,borderColor:'#562027',alignItems:'center',justifyContent:'center'},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
  centerText:{color:theme.colors.muted,marginTop:10},
});
