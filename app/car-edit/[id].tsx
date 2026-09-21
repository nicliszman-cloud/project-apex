import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages, resolveMediaUrl, storagePathFromPublicUrl, uploadPublicImage } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { CarCategory } from '@/types';

const categories:CarCategory[]=['JDM','Euro','Muscle','Supercar','Hot Hatch','Track'];
const fuels=['Gasolina','Etanol','Flex','Diesel','Elétrico','Híbrido'];

export default function CarEditScreen(){
  const {id}=useLocalSearchParams<{id:string}>();
  const {cars,myUserId,refreshRemoteData}=useApp();
  const car=cars.find((item)=>item.id===id);
  const [make,setMake]=useState('');const [model,setModel]=useState('');const [version,setVersion]=useState('');const [year,setYear]=useState('');
  const [engine,setEngine]=useState('');const [transmission,setTransmission]=useState('');const [drivetrain,setDrivetrain]=useState('');
  const [fuel,setFuel]=useState('Gasolina');const [stockHp,setStockHp]=useState('');const [currentHp,setCurrentHp]=useState('');
  const [category,setCategory]=useState<CarCategory>('Euro');const [description,setDescription]=useState('');const [mods,setMods]=useState('');
  const [replacementImages,setReplacementImages]=useState<LocalImage[]>([]);const [photoUrls,setPhotoUrls]=useState('');const [saving,setSaving]=useState(false);

  useEffect(()=>{if(!car)return;setMake(car.make);setModel(car.model);setVersion(car.version||'');setYear(String(car.year));setEngine(car.engine);setTransmission(car.transmission);setDrivetrain(car.drivetrain);setFuel(car.fuel||'Gasolina');setStockHp(String(car.stockHp));setCurrentHp(String(car.currentHp));setCategory(car.category);setDescription(car.description||'');setMods(car.modifications.join('\n'));const external=(car.images?.length?car.images:[car.image]).filter((url)=>Boolean(url)&&storagePathFromPublicUrl(url)===null);setPhotoUrls(external.join('\n'))},[car?.id]);

  async function choosePhotos(){try{const selected=await pickImages(true);if(selected.length)setReplacementImages(selected)}catch(error:any){Alert.alert('Fotos',error?.message??'Não foi possível abrir a galeria.')}}

  async function save(){
    if(!supabase||!car||car.ownerId!==myUserId||!myUserId)return;
    if(!make.trim()||!model.trim())return Alert.alert('Dados do carro','Marca e modelo são obrigatórios.');
    setSaving(true);
    try{
      const {error}=await supabase.from('cars').update({
        make:make.trim(),model:model.trim(),version:version.trim()||null,model_year:Number(year),engine:engine.trim(),transmission:transmission.trim(),drivetrain:drivetrain.trim(),
        fuel:fuel||null,description:description.trim()||null,stock_hp:Number(stockHp||0),current_hp:Number(currentHp||0),category,
        modifications:mods.split('\n').map((m)=>m.trim()).filter(Boolean),
      }).eq('id',car.id);
      if(error)throw error;
      const remoteUrls=photoUrls.split(/\r?\n/).map((item)=>item.trim()).filter(Boolean).slice(0,6);
      if(replacementImages.length||remoteUrls.length){
        const {data:oldPhotos}=await supabase.from('car_photos').select('url').eq('car_id',car.id);
        const urls:string[]=[];
        for(const image of replacementImages.slice(0,6)) urls.push(await uploadPublicImage(myUserId,image,'cars/'+car.id));
        const remaining=Math.max(0,6-urls.length);
        for(const remoteUrl of remoteUrls.slice(0,remaining)){
          const resolved=resolveMediaUrl(remoteUrl)||remoteUrl.trim();
          if(resolved) urls.push(resolved);
        }
        if(urls.length){
          const {error:deleteRowsError}=await supabase.from('car_photos').delete().eq('car_id',car.id);if(deleteRowsError)throw deleteRowsError;
          const {error:insertError}=await supabase.from('car_photos').insert(urls.map((url,position)=>({car_id:car.id,url,position})));if(insertError)throw insertError;
          const {error:coverError}=await supabase.from('cars').update({cover_url:urls[0]}).eq('id',car.id);if(coverError)throw coverError;
          const oldPaths=(oldPhotos??[]).map((row:any)=>storagePathFromPublicUrl(row.url)).filter(Boolean) as string[];
          if(oldPaths.length)await supabase.storage.from('media').remove(oldPaths);
        }
      }
      await refreshRemoteData();router.replace('/car/'+car.id);
    }catch(error:any){Alert.alert('Editar carro',error?.message??'Não foi possível salvar.')}finally{setSaving(false)}
  }

  if(!car||car.ownerId!==myUserId)return <Screen><View style={styles.center}><Text style={styles.muted}>Você não pode editar este carro.</Text></View></Screen>;
  const images=replacementImages.length?replacementImages.map((item)=>item.uri):(car.images?.length?car.images:[car.image]);

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable style={styles.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={22} color={theme.colors.text}/></Pressable><View><Text style={styles.title}>Editar projeto</Text><Text style={styles.sub}>{car.make} {car.model}</Text></View></View>
    <Text style={styles.label}>Fotos</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>{images.map((uri,index)=><AppImage key={uri+index} uri={uri} style={styles.photo} placeholder={<Ionicons name="car-sport-outline" size={26} color={theme.colors.muted2}/>}/>)}</ScrollView>
    <Pressable style={styles.photoButton} onPress={()=>{void choosePhotos()}}><Ionicons name="images-outline" size={18} color={theme.colors.accent}/><Text style={styles.photoButtonText}>{replacementImages.length?'Trocar seleção':'Adicionar / trocar fotos'}</Text></Pressable>
    <Field
      label="URLs das fotos"
      value={photoUrls}
      onChangeText={setPhotoUrls}
      multiline
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="url"
      placeholder={'Cole uma URL por linha\nhttps://site.com/foto1.jpg'}
    />
    <Text style={styles.urlHelp}>URLs externas são salvas diretamente no projeto. A primeira foto vira a capa.</Text>
    <Field label="Marca" value={make} onChangeText={setMake}/><Field label="Modelo" value={model} onChangeText={setModel}/><Field label="Versão" value={version} onChangeText={setVersion}/>
    <View style={styles.row}><View style={{flex:1}}><Field label="Ano" value={year} onChangeText={setYear} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Potência atual" value={currentHp} onChangeText={setCurrentHp} keyboardType="number-pad"/></View></View>
    <Field label="Motor" value={engine} onChangeText={setEngine}/><Field label="Câmbio" value={transmission} onChangeText={setTransmission}/><Field label="Tração" value={drivetrain} onChangeText={setDrivetrain}/>
    <Text style={styles.label}>Combustível</Text><View style={styles.chips}>{fuels.map((item)=><Chip key={item} text={item} active={fuel===item} onPress={()=>setFuel(item)}/>)}</View>
    <Field label="Potência original" value={stockHp} onChangeText={setStockHp} keyboardType="number-pad"/>
    <Text style={styles.label}>Categoria</Text><View style={styles.chips}>{categories.map((item)=><Chip key={item} text={item} active={category===item} onPress={()=>setCategory(item)}/>)}</View>
    <Field label="Descrição" value={description} onChangeText={setDescription} multiline/><Field label="Modificações" value={mods} onChangeText={setMods} multiline/>
    <PrimaryButton onPress={()=>{void save()}} disabled={saving} style={styles.save}>{saving?'Salvando...':'Salvar alterações'}</PrimaryButton>
  </ScrollView></Screen>
}

function Field({label,multiline,...props}:any){return <View><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor={theme.colors.muted2} textAlignVertical={multiline?'top':'center'} style={[styles.input,multiline&&styles.multiline]}/></View>}
function Chip({active,text,onPress}:{active:boolean;text:string;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.chip,active&&styles.chipOn]}><Text style={[styles.chipText,active&&styles.chipTextOn]}>{text}</Text></Pressable>}

const styles=StyleSheet.create({
  content:{padding:16,paddingBottom:38},header:{flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',marginRight:12},
  title:{color:theme.colors.text,fontSize:24,fontWeight:'900'},sub:{color:theme.colors.muted,fontSize:10,marginTop:2},label:{color:theme.colors.textSoft,fontSize:11,fontWeight:'800',marginTop:17,marginBottom:7},
  photoRow:{gap:8},photo:{width:104,height:104,borderRadius:12},photoButton:{height:42,borderRadius:theme.radius.md,borderWidth:1,borderColor:'#511117',marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  photoButtonText:{color:theme.colors.text,fontSize:11,fontWeight:'900'},input:{backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,color:theme.colors.text,paddingHorizontal:13,minHeight:46},
  multiline:{minHeight:105,paddingTop:12},urlHelp:{color:theme.colors.muted2,fontSize:9.5,lineHeight:14,marginTop:6},row:{flexDirection:'row',gap:10},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:theme.colors.border,borderRadius:18,paddingHorizontal:12,paddingVertical:8,backgroundColor:theme.colors.surface},
  chipOn:{borderColor:theme.colors.accent,backgroundColor:'#22080A'},chipText:{color:theme.colors.muted,fontSize:10.5,fontWeight:'800'},chipTextOn:{color:theme.colors.text},save:{marginTop:24},center:{flex:1,alignItems:'center',justifyContent:'center'},muted:{color:theme.colors.muted},
});
