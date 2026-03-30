import { getClients, getServices } from './src/utils/supabase.js';

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...\n');

  try {
    // Testar busca de clientes
    const clients = await getClients();
    console.log('✅ Clientes encontrados:', clients.length);
    console.log('Clientes:', clients);

    // Testar busca de serviços
    const services = await getServices();
    console.log('\n✅ Serviços encontrados:', services.length);
    console.log('Serviços:', services);

    console.log('\n🎉 Conexão com Supabase funcionando perfeitamente!');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
  }
}

testSupabase();
