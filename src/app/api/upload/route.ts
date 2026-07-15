import { NextRequest, NextResponse } from 'next/server';
import { parseNFe } from '@/services/nfeParser';
import { saveNFeToDatabase } from '@/services/database';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const xmlString = await file.text();
    
    // Faz o parse do XML
    const parsedData = parseNFe(xmlString);
    
    if (!parsedData) {
      return NextResponse.json({ error: 'Falha ao processar o arquivo XML. Verifique se é uma NFe válida.' }, { status: 400 });
    }

    // Tenta salvar no banco de dados (só vai funcionar se o Supabase estiver configurado certinho)
    const dbResult = await saveNFeToDatabase(parsedData);
    
    return NextResponse.json({ 
      success: true, 
      data: parsedData,
      dbStatus: dbResult
    });
    
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
