import { supabase } from '@/lib/supabase';

export async function openConversation(otherUserId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.rpc('open_conversation', {
    p_other_user: otherUserId,
  });
  if (error) throw error;
  if (!data) throw new Error('Não foi possível abrir a conversa.');
  return data as string;
}
