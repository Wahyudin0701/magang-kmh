import { supabase } from './supabase';
import { eachDayOfInterval, isSunday, format } from 'date-fns';

export async function initializeLogbook(userId) {
  // Check if entries already exist
  const { count, error: countError } = await supabase
    .from('logbook_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Error checking entries:', countError);
    return false;
  }

  // If already initialized, skip
  if (count > 0) return true;

  // Generate days from Aug 3, 2026 to Nov 3, 2026
  const startDate = new Date(2026, 7, 3); // Month is 0-indexed (7 = August)
  const endDate = new Date(2026, 10, 3); // 10 = November

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Filter out Sundays
  const workingDays = allDays.filter(day => !isSunday(day));

  const entriesToInsert = workingDays.map(day => ({
    user_id: userId,
    date: format(day, 'yyyy-MM-dd'),
    activity: '',
    description: '',
    photos: [],
    is_holiday: false,
    holiday_name: null
  }));

  // Insert in chunks to avoid payload limits if necessary, 
  // but ~80 rows is very small, we can insert all at once.
  const { error: insertError } = await supabase
    .from('logbook_entries')
    .insert(entriesToInsert);

  if (insertError) {
    console.error('Error inserting days:', insertError);
    return false;
  }

  return true;
}
