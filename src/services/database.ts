import { supabase } from '@/lib/supabase';
import { NFeData } from './nfeParser';

export async function saveNFeToDatabase(data: NFeData) {
  try {
    // 1. Insert or get Emitente
    const emitenteId = await upsertEmpresa(data.emitente.cnpj, data.emitente.razaoSocial, 'EMITENTE');
    
    // 2. Insert or get Destinatario (if you want to track it)
    await upsertEmpresa(data.destinatario.cnpj, data.destinatario.razaoSocial, 'CLIENTE');

    if (!emitenteId) throw new Error("Falha ao salvar emitente.");

    // 3. Insert Products and Prices
    for (const prod of data.produtos) {
      // Upsert Product
      const produtoId = await upsertProduto(prod.codigo, prod.nome);
      if (!produtoId) continue;

      // Insert Price Record
      await insertPreco({
        produto_id: produtoId,
        empresa_id: emitenteId,
        valor_unitario: prod.valorUnitario,
        quantidade: prod.quantidade
      });
    }

    return { success: true, message: 'Dados salvos com sucesso!' };
  } catch (error: any) {
    console.error("Database error:", error);
    return { success: false, message: error.message || 'Erro ao salvar no banco.' };
  }
}

async function upsertEmpresa(cnpj: string, razaoSocial: string, tipo: string) {
  if (!cnpj) return null;
  
  const { data: existing, error: findError } = await supabase
    .from('empresas')
    .select('id')
    .eq('cnpj', cnpj)
    .single();
    
  if (existing) return existing.id;
  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding empresa:', findError);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('empresas')
    .insert([{ cnpj, razao_social: razaoSocial, tipo }])
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting empresa:', insertError);
    return null;
  }
  
  return inserted?.id;
}

async function upsertProduto(codigo: string, nome: string) {
  if (!nome) return null;

  const { data: existing, error: findError } = await supabase
    .from('produtos')
    .select('id')
    .eq('nome', nome)
    .single();

  if (existing) return existing.id;
  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding produto:', findError);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('produtos')
    .insert([{ codigo, nome }])
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting produto:', insertError);
    return null;
  }

  return inserted?.id;
}

async function insertPreco(precoData: { produto_id: string, empresa_id: string, valor_unitario: number, quantidade: number }) {
  const { error } = await supabase
    .from('precos')
    .insert([precoData]);

  if (error) {
    console.error('Error inserting preco:', error);
  }
}
