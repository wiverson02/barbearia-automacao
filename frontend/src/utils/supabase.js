import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Credenciais do Supabase não configuradas!\n' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  );
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Funções helper para Clientes
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getClientById(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createClient(clientData) {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Funções helper para Serviços
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data;
}

// Funções helper para Agendamentos
export async function getAppointments(filters = {}) {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      client:clients(*),
      service:services(*)
    `)
    .order('appointment_date', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.startDate) {
    query = query.gte('appointment_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('appointment_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function createAppointment(appointmentData) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select(`
      *,
      client:clients(*),
      service:services(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      client:clients(*),
      service:services(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

// Realtime - Subscribe para mudanças
export function subscribeToAppointments(callback) {
  return supabase
    .channel('appointments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments'
      },
      callback
    )
    .subscribe();
}
