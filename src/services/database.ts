import { supabase } from '@/lib/supabase';
import { NFeData } from './nfeParser';

export async function saveNFeToDatabase(data: NFeData) {
  try {
    // 1. Insere ou busca o Emitente (empresa que emitiu a nota)
    const emitenteId = await upsertEmpresa(data.emitente, 'EMITENTE');
    
    // 2. Insere ou busca o Destinatário (cliente que recebeu a nota)
    await upsertEmpresa(data.destinatario, 'CLIENTE');

    if (!emitenteId) throw new Error("Falha ao salvar emitente.");

    // 3. Insere os Produtos e os Preços
    for (const prod of data.produtos) {
      // Garante que o produto existe (não duplica o nome)
      const produtoId = await upsertProduto(prod.codigo, prod.nome);
      if (!produtoId) continue;

      // Insere o registro do histórico de preço e quantidade vinculando emitente e produto
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

async function upsertEmpresa(empresa: NFeData['emitente'], tipo: string) {
  if (!empresa.cnpj) return null;
  
  const { data: existing, error: findError } = await supabase
    .from('empresas')
    .select('id')
    .eq('cnpj', empresa.cnpj)
    .single();
    
  if (existing) return existing.id;
  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding empresa:', findError);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('empresas')
    .insert([{ 
      cnpj: empresa.cnpj, 
      razao_social: empresa.razaoSocial, 
      tipo,
      inscricao_estadual: empresa.inscricaoEstadual,
      logradouro: empresa.logradouro,
      numero: empresa.numero,
      complemento: empresa.complemento,
      bairro: empresa.bairro,
      municipio: empresa.municipio,
      uf: empresa.uf,
      cep: empresa.cep,
      telefone: empresa.telefone
    }])
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
