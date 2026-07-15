import { XMLParser } from 'fast-xml-parser';

export interface NFeData {
  emitente: {
    cnpj: string;
    razaoSocial: string;
  };
  destinatario: {
    cnpj: string;
    razaoSocial: string;
  };
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
      parseAttributeValue: true,
      textNodeName: "_text",
    });
    
    const parsed = parser.parse(xmlString);
    
    // NFe structure can vary, usually it's under nfeProc -> NFe -> infNFe
    const infNFe = parsed?.nfeProc?.NFe?.infNFe || parsed?.NFe?.infNFe;
    
    if (!infNFe) {
      console.error("Invalid NFe XML structure");
      return null;
    }

    const emitente = {
      cnpj: infNFe.emit?.CNPJ ? String(infNFe.emit.CNPJ) : '',
      razaoSocial: infNFe.emit?.xNome || 'Desconhecido',
    };

    const destinatario = {
      cnpj: infNFe.dest?.CNPJ ? String(infNFe.dest.CNPJ) : (infNFe.dest?.CPF ? String(infNFe.dest.CPF) : ''),
      razaoSocial: infNFe.dest?.xNome || 'Desconhecido',
    };

    // Det can be an array or a single object
    const detArray = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
    
    const produtos = detArray.filter(Boolean).map((det: any) => ({
      codigo: det.prod?.cProd ? String(det.prod.cProd) : '',
      nome: det.prod?.xProd || 'Produto Desconhecido',
      quantidade: parseFloat(det.prod?.qCom || '0'),
      valorUnitario: parseFloat(det.prod?.vUnCom || '0'),
    }));

    return {
      emitente,
      destinatario,
      produtos
    };
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
}
