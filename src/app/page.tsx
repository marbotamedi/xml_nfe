"use client";

import { useState } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle } from "lucide-react";
import { NFeData } from "@/services/nfeParser";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NFeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".xml")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Por favor, selecione um arquivo XML válido.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setDbStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data.data);
        setDbStatus(data.dbStatus);
      } else {
        setError(data.error || "Erro ao processar o arquivo.");
      }
    } catch (err: any) {
      setError("Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Leitor de NFe</h1>
          <p className="text-gray-500">Importe suas notas fiscais em XML e salve no banco de dados automaticamente.</p>
        </header>

        {/* Área de Upload (Drag & Drop) */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-blue-300 rounded-2xl bg-white p-12 text-center hover:bg-blue-50 transition-colors cursor-pointer shadow-sm"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            accept=".xml" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
              <UploadCloud size={40} />
            </div>
            {file ? (
              <div className="flex items-center space-x-2 text-green-600 font-medium text-lg">
                <FileType size={24} />
                <span>{file.name}</span>
              </div>
            ) : (
              <div>
                <p className="text-xl font-semibold text-gray-700">Clique para buscar ou arraste o XML aqui</p>
                <p className="text-sm text-gray-400 mt-1">Suporta apenas arquivos .xml</p>
              </div>
            )}
          </div>
        </div>

        {file && (
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? <span>Processando...</span> : <span>Processar e Salvar XML</span>}
            </button>
          </div>
        )}

        {/* Avisos e Alertas (Erros ou Sucesso) */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center space-x-3 text-red-700">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        {dbStatus && (
          <div className={`p-4 rounded-md flex items-center space-x-3 ${dbStatus.success ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700'}`}>
            {dbStatus.success ? <CheckCircle /> : <AlertCircle />}
            <p>{dbStatus.message}</p>
          </div>
        )}

        {/* Prévia dos Resultados Lidos da Nota */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-6 space-y-1 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emitente</p>
                <p className="font-semibold text-lg text-gray-900">{result.emitente.razaoSocial}</p>
                <p className="text-sm text-gray-500">CNPJ: {result.emitente.cnpj}</p>
              </div>
              <div className="p-6 space-y-1 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destinatário</p>
                <p className="font-semibold text-lg text-gray-900">{result.destinatario.razaoSocial}</p>
                <p className="text-sm text-gray-500">CNPJ/CPF: {result.destinatario.cnpj}</p>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span>Produtos ({result.produtos.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide">
                      <th className="p-3 rounded-tl-lg">Código</th>
                      <th className="p-3">Nome do Produto</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-right rounded-tr-lg">V. Unitário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.produtos.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3 text-sm text-gray-500 font-mono">{prod.codigo}</td>
                        <td className="p-3 text-sm font-medium text-gray-800">{prod.nome}</td>
                        <td className="p-3 text-sm text-right text-gray-600">{prod.quantidade}</td>
                        <td className="p-3 text-sm text-right text-green-600 font-semibold">
                          R$ {prod.valorUnitario.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
