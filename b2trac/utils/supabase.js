import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// createClient lanza si la URL falta, lo que rompe el build al prerenderizar
// las paginas que importan este modulo. Con placeholders el build pasa y el
// fallo aparece recien al consultar datos, con un mensaje entendible.
export const configurado = Boolean(supabaseUrl && supabaseAnonKey);

if (!configurado && typeof window !== 'undefined') {
  console.warn(
    'Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Cargalas en las variables de entorno de Vercel.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Funciones para pedidos
export async function crearPedido(pedido) {
  const { data, error } = await supabase
    .from('pedidos')
    .insert([pedido])
    .select();
  if (error) throw error;
  return data;
}

export async function obtenerPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nombre, empresa)');
  if (error) throw error;
  return data;
}

export async function obtenerPedido(id) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Funciones para clientes
export async function crearCliente(cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select();
  if (error) throw error;
  return data;
}

export async function obtenerClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*');
  if (error) throw error;
  return data;
}

// Funciones para Storage
export async function subirArchivo(bucket, ruta, archivo) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(ruta, archivo);
  if (error) throw error;
  
  // Obtener URL pública
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(ruta);
  
  return publicData.publicUrl;
}

export async function obtenerUrlPublica(bucket, ruta) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(ruta);
  return data.publicUrl;
}
