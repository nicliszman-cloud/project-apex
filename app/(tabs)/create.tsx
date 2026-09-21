import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages } from '@/lib/media';
import { theme } from '@/lib/theme';
import { CarCategory } from '@/types';

type Mode='hub'|'car'|'post'|'event';
const categories:CarCategory[]=['JDM','Euro','Muscle','Supercar','Hot Hatch','Track'];
const drivetrains=['RWD','AWD','FWD'];
const fuels=['Gasolina','Etanol','Flex','Diesel','Elétrico','Híbrido'];

export default function CreateScreen(){
  const {addCar,createPost,createEvent,profile,cars,myUserId}=useApp();
  const [mode,setMode]=useState<Mode>('hub');
  const [saving,setSaving]=useState(false);

  const [make,setMake]=useState('');
  const [model,setModel]=useState('');
  const [version,setVersion]=useState('');
  const [year,setYear]=useState('');
  const [engine,setEngine]=useState('');
  const [transmission,setTransmission]=useState('');
  const [drivetrain,setDrivetrain]=useState('RWD');
  const [fuel,setFuel]=useState('Gasolina');
  const [stockHp,setStockHp]=useState('');
  const [currentHp,setCurrentHp]=useState('');
  const [category,setCategory]=useState<CarCategory>('JDM');
  const [description,setDescription]=useState('');
  const [mods,setMods]=useState('');
  const [carImages,setCarImages]=useState<LocalImage[]>([]);
  const [carImageUrls,setCarImageUrls]=useState('');

  const [postCaption,setPostCaption]=useState('');
  const [postImage,setPostImage]=useState<LocalImage|null>(null);
  const [postImageUrl,setPostImageUrl]=useState('');
  const [postCarId,setPostCarId]=useState<string|null>(null);
  const myCars=useMemo(()=>cars.filter((car)=>car.ownerId===myUserId),[cars,myUserId]);

  const [eventTitle,setEventTitle]=useState('');
  const [eventDescription,setEventDescription]=useState('');
  const [eventCategory,setEventCategory]=useState('Meet');
  const [eventVenue,setEventVenue]=useState('');
  const [eventCity,setEventCity]=useState(profile?.city||'');
  const [eventState,setEventState]=useState(profile?.state||'');
  const [eventStarts,setEventStarts]=useState('');
  const [eventImage,setEventImage]=useState<LocalImage|null>(null);
  const [eventLatitude,setEventLatitude]=useState<number|null>(null);
  const [eventLongitude,setEventLongitude]=useState<number|null>(null);
  const [locatingEvent,setLocatingEvent]=useState(false);

  async function chooseImages(multiple:boolean){
    try{return await pickImages(multiple);}catch(error:any){Alert.alert('Fotos',error?.message ?? 'Não foi possível abrir a galeria.');return []}
  }

  async function saveCar(){
    if(!make.trim()||!model.trim()||!year.trim()) return Alert.alert('Faltam dados','Preencha marca, modelo e ano.');
    const parsedYear=Number(year);
    if(!Number.isFinite(parsedYear)||parsedYear<1886||parsedYear>new Date().getFullYear()+1) return Alert.alert('Ano inválido','Confira o ano do carro.');
    setSaving(true);
    try{
      const remoteUrls=carImageUrls.split(/\r?\n/).map((item)=>item.trim()).filter(Boolean).slice(0,6);
      await addCar({
        make:make.trim(),model:model.trim(),version:version.trim()||null,year:parsedYear,engine:engine.trim()||'Não informado',transmission:transmission.trim()||'Não informado',drivetrain,
        fuel:fuel||null,description:description.trim()||null,stockHp:Number(stockHp||0),currentHp:Number(currentHp||stockHp||0),
        city:profile?.city||'Não informado',state:profile?.state||'BR',category,image:carImages[0]?.uri||remoteUrls[0]||'',
        modifications:mods.split('\n').map((item)=>item.trim()).filter(Boolean),tags:[category,'Build'],
      },carImages,remoteUrls);
      router.replace('/(tabs)/garage');
    }catch(error:any){Alert.alert('Cadastrar carro',error?.message ?? 'Não foi possível salvar.')}finally{setSaving(false)}
  }

  async function savePost(){
    if(!postImage && !postImageUrl.trim()) return Alert.alert('Escolha uma foto','Adicione uma foto da galeria ou cole uma URL de imagem.');
    if(!postCaption.trim()) return Alert.alert('Legenda','Escreva uma legenda.');
    setSaving(true);
    try{
      await createPost({
        caption:postCaption.trim(),
        carId:postCarId,
        image:postImage,
        imageUrl:postImage ? null : postImageUrl.trim(),
      });
      router.replace('/(tabs)/feed');
    }
    catch(error:any){Alert.alert('Publicar',error?.message ?? 'Não foi possível publicar.')}finally{setSaving(false)}
  }

  async function locateEvent(){
    setLocatingEvent(true);
    try{
      const permission=await Location.requestForegroundPermissionsAsync();
      if(permission.status!=='granted') return Alert.alert('Localização','Permita o acesso à localização para posicionar o evento no mapa.');

      const address=[eventVenue,eventCity,eventState,'Brasil'].filter(Boolean).join(', ');
      if(address.trim()){
        const results=await Location.geocodeAsync(address);
        if(results[0]){
          setEventLatitude(results[0].latitude);
          setEventLongitude(results[0].longitude);
          return;
        }
      }

      const current=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setEventLatitude(current.coords.latitude);
      setEventLongitude(current.coords.longitude);
    }catch(error:any){
      Alert.alert('Mapa',error?.message ?? 'Não foi possível localizar este endereço.');
    }finally{
      setLocatingEvent(false);
    }
  }

  async function saveEvent(){
    const parsed=new Date(eventStarts.replace(' ','T'));
    if(!eventTitle.trim()||!eventVenue.trim()||!eventCity.trim()||!eventState.trim()) return Alert.alert('Faltam informações','Preencha título, local, cidade e UF.');
    if(!eventStarts.trim()||Number.isNaN(parsed.getTime())) return Alert.alert('Data inválida','Use o formato 2026-10-04 19:00.');
    setSaving(true);
    try{
      let latitude=eventLatitude;
      let longitude=eventLongitude;

      if(latitude==null||longitude==null){
        try{
          const permission=await Location.requestForegroundPermissionsAsync();
          if(permission.status==='granted'){
            const results=await Location.geocodeAsync([eventVenue,eventCity,eventState,'Brasil'].join(', '));
            if(results[0]){
              latitude=results[0].latitude;
              longitude=results[0].longitude;
            }
          }
        }catch{}
      }

      await createEvent({
        title:eventTitle.trim(),
        description:eventDescription.trim(),
        category:eventCategory.trim()||'Meet',
        venueName:eventVenue.trim(),
        city:eventCity.trim(),
        state:eventState.trim().toUpperCase(),
        startsAt:parsed.toISOString(),
        image:eventImage,
        latitude,
        longitude,
      });
      router.replace('/(tabs)/meets');
    }
    catch(error:any){Alert.alert('Criar evento',error?.message ?? 'Não foi possível criar.')}finally{setSaving(false)}
  }

  if(mode==='hub') return <CreateHub onSelect={setMode}/>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Pressable style={styles.back} onPress={()=>setMode('hub')}><Ionicons name="chevron-back" size={22} color={theme.colors.text}/></Pressable><View><Text style={styles.title}>{mode==='car'?'Cadastrar carro':mode==='post'?'Criar post':'Criar evento'}</Text><Text style={styles.sub}>StreetClub</Text></View></View>

        {mode==='car'&&<>
          <Text style={styles.label}>Fotos</Text>
          <Pressable style={styles.photoPicker} onPress={async()=>{const list=await chooseImages(true);if(list.length)setCarImages(list)}}>
            {carImages.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>{carImages.map((image,index)=><AppImage key={image.uri+index} uri={image.uri} style={styles.preview}/>)}</ScrollView>:<View style={styles.photoEmpty}><Ionicons name="images-outline" size={30} color={theme.colors.accent}/><Text style={styles.photoTitle}>Adicionar fotos</Text><Text style={styles.photoSub}>Até 6 imagens · a primeira será a capa</Text></View>}
          </Pressable>
          <Field
            label="URLs das fotos (opcional)"
            value={carImageUrls}
            onChangeText={setCarImageUrls}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={'Cole uma URL por linha\nhttps://site.com/foto1.jpg\nhttps://site.com/foto2.jpg'}
          />
          <Text style={styles.urlHelp}>URLs externas ficam vinculadas diretamente ao projeto. Fotos da galeria são enviadas ao StreetClub.</Text>
          <Field label="Marca" value={make} onChangeText={setMake} placeholder="Nissan"/>
          <Field label="Modelo" value={model} onChangeText={setModel} placeholder="Silvia S15"/>
          <Field label="Versão" value={version} onChangeText={setVersion} placeholder="Spec-R"/>
          <View style={styles.row}><View style={{flex:1}}><Field label="Ano" value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2002"/></View><View style={{flex:1}}><Field label="Potência (cv)" value={currentHp} onChangeText={setCurrentHp} keyboardType="number-pad" placeholder="250"/></View></View>
          <Field label="Motor" value={engine} onChangeText={setEngine} placeholder="2.0 Turbo (SR20DET)"/>
          <Field label="Câmbio" value={transmission} onChangeText={setTransmission} placeholder="Manual 6 marchas"/>
          <Text style={styles.label}>Tração</Text><View style={styles.chips}>{drivetrains.map((item)=><Chip key={item} text={item} active={drivetrain===item} onPress={()=>setDrivetrain(item)}/>)}</View>
          <Text style={styles.label}>Combustível</Text><View style={styles.chips}>{fuels.map((item)=><Chip key={item} text={item} active={fuel===item} onPress={()=>setFuel(item)}/>)}</View>
          <Text style={styles.label}>Categoria</Text><View style={styles.chips}>{categories.map((item)=><Chip key={item} text={item} active={category===item} onPress={()=>setCategory(item)}/>)}</View>
          <Field label="Potência original (cv)" value={stockHp} onChangeText={setStockHp} keyboardType="number-pad" placeholder="250"/>
          <Field label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Conte a história e a proposta do projeto..."/>
          <Field label="Modificações" value={mods} onChangeText={setMods} multiline placeholder={'Uma por linha\nTurbo GTX\nCoilovers\nRodas 18”'}/>
          <PrimaryButton onPress={()=>{void saveCar();}} disabled={saving} style={styles.save}>{saving?'Salvando...':'Cadastrar carro'}</PrimaryButton>
        </>}

        {mode==='post'&&<>
          <Text style={styles.label}>Foto</Text>
          <Pressable style={styles.postPhoto} onPress={async()=>{const list=await chooseImages(false);if(list[0])setPostImage(list[0])}}>
            {postImage?<AppImage uri={postImage.uri} style={StyleSheet.absoluteFill}/>:postImageUrl.trim()?<AppImage uri={postImageUrl.trim()} style={StyleSheet.absoluteFill}/>:<View style={styles.photoEmpty}><Ionicons name="camera-outline" size={32} color={theme.colors.accent}/><Text style={styles.photoTitle}>Selecionar foto</Text><Text style={styles.photoSub}>ou use uma URL abaixo</Text></View>}
          </Pressable>
          <Field label="URL da foto (opcional)" value={postImageUrl} onChangeText={setPostImageUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://site.com/foto.jpg"/>
          <Field label="Legenda" value={postCaption} onChangeText={setPostCaption} multiline placeholder="Conte sobre o projeto, a noite, a build..."/>
          <Text style={styles.label}>Carro relacionado</Text><View style={styles.chips}><Chip text="Nenhum" active={!postCarId} onPress={()=>setPostCarId(null)}/>{myCars.map((car)=><Chip key={car.id} text={car.make+' '+car.model} active={postCarId===car.id} onPress={()=>setPostCarId(car.id)}/>)}</View>
          <View style={styles.infoRow}><Ionicons name="location-outline" size={17} color={theme.colors.muted}/><Text style={styles.infoText}>{[profile?.city,profile?.state].filter(Boolean).join(', ')||'Localização do perfil'}</Text></View>
          <View style={styles.infoRow}><Ionicons name="chatbubble-outline" size={17} color={theme.colors.muted}/><Text style={styles.infoText}>Comentários ativados</Text></View>
          <PrimaryButton onPress={()=>{void savePost();}} disabled={saving} style={styles.save}>{saving?'Publicando...':'Publicar'}</PrimaryButton>
        </>}

        {mode==='event'&&<>
          <Text style={styles.label}>Capa</Text>
          <Pressable style={styles.postPhoto} onPress={async()=>{const list=await chooseImages(false);if(list[0])setEventImage(list[0])}}>
            {eventImage?<AppImage uri={eventImage.uri} style={StyleSheet.absoluteFill}/>:<View style={styles.photoEmpty}><Ionicons name="image-outline" size={32} color={theme.colors.accent}/><Text style={styles.photoTitle}>Selecionar capa</Text></View>}
          </Pressable>
          <Field label="Nome do evento" value={eventTitle} onChangeText={setEventTitle} placeholder="Street Night Meet"/>
          <Field label="Categoria" value={eventCategory} onChangeText={setEventCategory} placeholder="Meet, Track, JDM, Euro..."/>
          <Field label="Descrição" value={eventDescription} onChangeText={setEventDescription} multiline placeholder="Regras, horários e detalhes..."/>
          <Field label="Local" value={eventVenue} onChangeText={setEventVenue} placeholder="Nome do local"/>
          <View style={styles.row}><View style={{flex:1}}><Field label="Cidade" value={eventCity} onChangeText={setEventCity} placeholder="Cascavel"/></View><View style={{width:82}}><Field label="UF" value={eventState} onChangeText={setEventState} placeholder="PR"/></View></View>
          <Field label="Data e horário" value={eventStarts} onChangeText={setEventStarts} placeholder="2026-10-04 19:00"/>
          <Pressable style={[styles.mapLocation,eventLatitude!=null&&eventLongitude!=null&&styles.mapLocationReady]} onPress={()=>{void locateEvent();}} disabled={locatingEvent}>
            <Ionicons name={eventLatitude!=null&&eventLongitude!=null?'location':'map-outline'} size={18} color={eventLatitude!=null&&eventLongitude!=null?theme.colors.white:theme.colors.accent}/>
            <View style={{flex:1}}>
              <Text style={[styles.mapLocationTitle,eventLatitude!=null&&eventLongitude!=null&&styles.mapLocationTitleReady]}>{locatingEvent?'Localizando...':eventLatitude!=null&&eventLongitude!=null?'Local marcado no mapa':'Localizar endereço no mapa'}</Text>
              <Text style={[styles.mapLocationSub,eventLatitude!=null&&eventLongitude!=null&&styles.mapLocationSubReady]}>{eventLatitude!=null&&eventLongitude!=null?'O evento aparecerá como pin no mapa.':'Usa o local, cidade e UF informados acima.'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={eventLatitude!=null&&eventLongitude!=null?theme.colors.white:theme.colors.muted2}/>
          </Pressable>
          <PrimaryButton onPress={()=>{void saveEvent();}} disabled={saving} style={styles.save}>{saving?'Criando...':'Criar evento'}</PrimaryButton>
        </>}
      </ScrollView>
    </Screen>
  );
}

function CreateHub({onSelect}:{onSelect:(mode:Mode)=>void}){
  const options=[
    {mode:'post' as Mode,icon:'camera-outline' as const,title:'Publicar foto',sub:'Compartilhe seu projeto com a comunidade'},
    {mode:'car' as Mode,icon:'car-sport-outline' as const,title:'Cadastrar carro',sub:'Adicione um projeto à sua garagem'},
    {mode:'event' as Mode,icon:'calendar-outline' as const,title:'Criar evento',sub:'Organize um meet, track day ou encontro'},
  ];
  return <Screen><View style={styles.hubHeader}><Text style={styles.hubTitle}>Criar</Text><Text style={styles.hubSub}>O que vai para a rua hoje?</Text></View><View style={styles.hubList}>{options.map((item)=><Pressable key={item.mode} style={styles.hubCard} onPress={()=>onSelect(item.mode)}><View style={styles.hubIcon}><Ionicons name={item.icon} size={24} color={theme.colors.accent}/></View><View style={{flex:1}}><Text style={styles.hubCardTitle}>{item.title}</Text><Text style={styles.hubCardSub}>{item.sub}</Text></View><Ionicons name="chevron-forward" size={19} color={theme.colors.muted2}/></Pressable>)}<Pressable style={styles.hubCard} onPress={()=>router.push('/marketplace-create')}><View style={styles.hubIcon}><Ionicons name="construct-outline" size={24} color={theme.colors.accent}/></View><View style={{flex:1}}><Text style={styles.hubCardTitle}>Anunciar peça</Text><Text style={styles.hubCardSub}>Venda, troque ou procure peças</Text></View><Ionicons name="chevron-forward" size={19} color={theme.colors.muted2}/></Pressable></View></Screen>
}

function Field({label,multiline,...props}:any){return <View><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor={theme.colors.muted2} textAlignVertical={multiline?'top':'center'} style={[styles.input,multiline&&styles.multiline]}/></View>}
function Chip({active,text,onPress}:{active:boolean;text:string;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.chip,active&&styles.chipOn]}><Text style={[styles.chipText,active&&styles.chipTextOn]}>{text}</Text></Pressable>}

const styles=StyleSheet.create({
  content:{padding:16,paddingBottom:38},
  header:{flexDirection:'row',alignItems:'center',marginBottom:6},
  back:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',marginRight:12},
  title:{color:theme.colors.text,fontSize:24,fontWeight:'900'},
  sub:{color:theme.colors.accent,fontSize:9,fontWeight:'900',letterSpacing:1.4,marginTop:2},
  label:{color:theme.colors.textSoft,fontSize:11,fontWeight:'800',marginTop:17,marginBottom:7},
  input:{backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,color:theme.colors.text,paddingHorizontal:13,minHeight:46},
  multiline:{minHeight:105,paddingTop:12},
  row:{flexDirection:'row',gap:10},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8},
  chip:{borderWidth:1,borderColor:theme.colors.border,borderRadius:18,paddingHorizontal:12,paddingVertical:8,backgroundColor:theme.colors.surface},
  chipOn:{borderColor:theme.colors.accent,backgroundColor:'#22080A'},
  chipText:{color:theme.colors.muted,fontSize:10.5,fontWeight:'800'},
  chipTextOn:{color:theme.colors.text},
  photoPicker:{minHeight:128,borderWidth:1,borderStyle:'dashed',borderColor:theme.colors.borderStrong,borderRadius:theme.radius.lg,overflow:'hidden',backgroundColor:theme.colors.surface},
  photoRow:{padding:8,gap:8},
  preview:{width:102,height:102,borderRadius:12},
  photoEmpty:{minHeight:128,alignItems:'center',justifyContent:'center',padding:20},
  photoTitle:{color:theme.colors.text,fontSize:13,fontWeight:'900',marginTop:8},
  photoSub:{color:theme.colors.muted,fontSize:9.5,marginTop:4},
  urlHelp:{color:theme.colors.muted2,fontSize:9.5,lineHeight:14,marginTop:6},
  postPhoto:{height:260,borderWidth:1,borderStyle:'dashed',borderColor:theme.colors.borderStrong,borderRadius:theme.radius.lg,overflow:'hidden',backgroundColor:theme.colors.surface},
  infoRow:{flexDirection:'row',alignItems:'center',gap:8,minHeight:44,borderBottomWidth:1,borderBottomColor:theme.colors.border},
  infoText:{color:theme.colors.muted,fontSize:11},
  mapLocation:{minHeight:58,marginTop:16,borderWidth:1,borderColor:theme.colors.borderStrong,borderRadius:theme.radius.md,backgroundColor:theme.colors.surface,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:13},
  mapLocationReady:{backgroundColor:theme.colors.accent,borderColor:theme.colors.accent},
  mapLocationTitle:{color:theme.colors.text,fontSize:11.5,fontWeight:'900'},
  mapLocationTitleReady:{color:theme.colors.white},
  mapLocationSub:{color:theme.colors.muted,fontSize:9,marginTop:3},
  mapLocationSubReady:{color:'rgba(255,255,255,.75)'},
  save:{marginTop:24},
  hubHeader:{paddingHorizontal:18,paddingTop:10,paddingBottom:18},
  hubTitle:{color:theme.colors.text,fontSize:29,fontWeight:'900'},
  hubSub:{color:theme.colors.muted,fontSize:12,marginTop:4},
  hubList:{paddingHorizontal:14,gap:10},
  hubCard:{minHeight:86,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.lg,backgroundColor:theme.colors.surface,flexDirection:'row',alignItems:'center',padding:14},
  hubIcon:{width:48,height:48,borderRadius:24,backgroundColor:'#170709',borderWidth:1,borderColor:'#4E1116',alignItems:'center',justifyContent:'center',marginRight:12},
  hubCardTitle:{color:theme.colors.text,fontSize:14,fontWeight:'900'},
  hubCardSub:{color:theme.colors.muted,fontSize:10.5,marginTop:4,lineHeight:15},
});
