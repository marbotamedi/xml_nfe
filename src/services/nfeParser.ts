import { XMLParser } from 'fast-xml-parser';

export interface EmpresaData {
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
}

export interface NFeInfo {
  numero: number;
  dataEmissao: string;
  dataSaida: string;
  natureza: string;
  protocolo: string;
  chave: string;
}

export interface NFeData {
  nfeInfo: NFeInfo;
  emitente: EmpresaData;
  destinatario: EmpresaData;
  produtos: Array<{
    codigo: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
  }>;
}

export function parseNFe(xmlString: string): NFeData | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: false,
      parseTagValue: false, // Evita que números muito grandes (como a chave NFe) virem notação científica
      textNodeName: "_text",
    });

    const parsed = parser.parse(xmlString);

    // A estrutura da NFe pode variar, mas geralmente está dentro de nfeProc -> NFe -> infNFe
    const infNFe = parsed?.nfeProc?.NFe?.infNFe || parsed?.NFe?.infNFe;

    if (!infNFe) {
      console.error("Invalid NFe XML structure");
      return null;
    }

    const nfeInfo = {
      numero: parseInt(infNFe.ide?.nNF) || 0,
      dataEmissao: infNFe.ide?.dhEmi || new Date().toISOString(),
      dataSaida: infNFe.ide?.dhSaiEnt || infNFe.ide?.dhEmi || new Date().toISOString(),
      natureza: infNFe.ide?.natOp || 'Desconhecida',
      protocolo: String(parsed?.nfeProc?.protNFe?.infProt?.nProt || ''),
      chave: String(parsed?.nfeProc?.protNFe?.infProt?.chNFe || infNFe['@_Id']?.replace('NFe', '') || '')
    };

    const emitente: EmpresaData = {
      cnpj: infNFe.emit?.CNPJ ? String(infNFe.emit.CNPJ) : '',
      razaoSocial: infNFe.emit?.xNome || 'Desconhecido',
      inscricaoEstadual: infNFe.emit?.IE ? String(infNFe.emit.IE) : undefined,
      logradouro: infNFe.emit?.enderEmit?.xLgr,
      numero: infNFe.emit?.enderEmit?.nro,
      complemento: infNFe.emit?.enderEmit?.xCpl,
      bairro: infNFe.emit?.enderEmit?.xBairro,
      municipio: infNFe.emit?.enderEmit?.xMun,
      uf: infNFe.emit?.enderEmit?.UF,
      cep: infNFe.emit?.enderEmit?.CEP ? String(infNFe.emit.enderEmit.CEP) : undefined,
      telefone: infNFe.emit?.enderEmit?.fone ? String(infNFe.emit.enderEmit.fone) : undefined,
    };

    const destinatario: EmpresaData = {
      cnpj: infNFe.dest?.CNPJ ? String(infNFe.dest.CNPJ) : (infNFe.dest?.CPF ? String(infNFe.dest.CPF) : ''),
      razaoSocial: infNFe.dest?.xNome || 'Desconhecido',
      inscricaoEstadual: infNFe.dest?.IE ? String(infNFe.dest.IE) : undefined,
      logradouro: infNFe.dest?.enderDest?.xLgr,
      numero: infNFe.dest?.enderDest?.nro,
      complemento: infNFe.dest?.enderDest?.xCpl,
      bairro: infNFe.dest?.enderDest?.xBairro,
      municipio: infNFe.dest?.enderDest?.xMun,
      uf: infNFe.dest?.enderDest?.UF,
      cep: infNFe.dest?.enderDest?.CEP ? String(infNFe.dest.enderDest.CEP) : undefined,
      telefone: infNFe.dest?.enderDest?.fone ? String(infNFe.dest.enderDest.fone) : undefined,
    };

    // O campo 'det' pode vir como uma lista (array) ou um único objeto, dependendo de quantos produtos tem na nota
    const detArray = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

    const produtos = detArray.filter(Boolean).map((det: any) => ({
      codigo: det.prod?.cProd ? String(det.prod.cProd) : '',
      nome: det.prod?.xProd || 'Produto Desconhecido',
      quantidade: parseFloat(det.prod?.qCom || '0'),
      valorUnitario: parseFloat(det.prod?.vUnCom || '0'),
    }));

    return {
      nfeInfo,
      emitente,
      destinatario,
      produtos
    };
  } catch (error) {
    console.error("Erro ao analisar o XML:", error);
    return null;
  }
}
