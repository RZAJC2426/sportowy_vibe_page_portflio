import { supabase } from '@/lib/supabase';
import { mockChannelSchedule } from '@/mocks/channelSchedule';

export interface ChannelScheduleItem {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
}

let scheduleCache: ChannelScheduleItem[] | null = null;

export async function fetchAllChannelSchedule(): Promise<ChannelScheduleItem[]> {
  if (scheduleCache) return scheduleCache;

  const { data, error } = await supabase
    .from('channel_schedule')
    .select('id, title, event_date, event_time')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });

  if (error) {
    console.error('fetchAllChannelSchedule error:', error);
    scheduleCache = mockChannelSchedule;
    return scheduleCache;
  }

  if (!data || data.length === 0) {
    scheduleCache = mockChannelSchedule;
    return scheduleCache;
  }

  scheduleCache = data as ChannelScheduleItem[];
  return scheduleCache;
}

export async function createScheduleItem(item: Omit<ChannelScheduleItem, 'id'>): Promise<ChannelScheduleItem | null> {
  const { data, error } = await supabase
    .from('channel_schedule')
    .insert({
      title: item.title,
      event_date: item.event_date,
      event_time: item.event_time,
    })
    .select('id, title, event_date, event_time')
    .single();

  if (error) {
    console.error('createScheduleItem error:', error);
    return null;
  }

  bustScheduleCache();
  return data as ChannelScheduleItem;
}

export async function updateScheduleItem(id: number, item: Omit<ChannelScheduleItem, 'id'>): Promise<boolean> {
  const { error } = await supabase
    .from('channel_schedule')
    .update({
      title: item.title,
      event_date: item.event_date,
      event_time: item.event_time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('updateScheduleItem error:', error);
    return false;
  }

  bustScheduleCache();
  return true;
}

export async function deleteScheduleItem(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('channel_schedule')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteScheduleItem error:', error);
    return false;
  }

  bustScheduleCache();
  return true;
}

export function bustScheduleCache(): void {
  scheduleCache = null;
}