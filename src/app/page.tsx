"use client";

import { useState } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { NFeData } from "@/services/nfeParser";

interface FileResult {
  fileName: string;
  success: boolean;
  message?: string;
  data?: NFeData;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith(".xml"));

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setGlobalError(null);
    } else {
      setGlobalError("Por favor, selecione apenas arquivos XML válidos.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.name.endsWith(".xml"));
      setFiles(prev => [...prev, ...selectedFiles]);
      setGlobalError(null);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setGlobalError(null);
    setResults([]);

    const newResults: FileResult[] = [];

    // Processar cada arquivo sequencialmente para não sobrecarregar o banco
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.dbStatus?.success) {
          newResults.push({
            fileName: file.name,
            success: true,
            message: data.dbStatus.message,
            data: data.data
          });
        } else {
          newResults.push({
            fileName: file.name,
            success: false,
            message: data.error || data.dbStatus?.message || "Erro desconhecido ao salvar."
          });
        }
      } catch (err: any) {
        newResults.push({
          fileName: file.name,
          success: false,
          message: "Falha na comunicação com o servidor."
        });
      }
    }

    setResults(newResults);
    setFiles([]); // Limpa a lista após enviar
    setLoading(false);
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
          className="border-2 border-dashed border-blue-300 rounded-2xl bg-white p-12 text-center hover:bg-blue-50 transition-colors cursor-pointer shadow-sm relative"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            type="file"
            id="file-upload"
            accept=".xml"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
              <UploadCloud size={40} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-700">Clique para buscar ou arraste os XMLs aqui</p>
              <p className="text-sm text-gray-400 mt-1">Você pode selecionar vários arquivos de uma vez.</p>
            </div>
          </div>
        </div>

        {/* Arquivos Selecionados */}
        {files.length > 0 && !loading && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-700">Arquivos Prontos para Envio ({files.length}):</h3>
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <FileType size={20} className="text-blue-500" />
                    <span className="font-medium text-sm">{f.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="text-red-400 hover:text-red-600 text-sm font-semibold"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleUploadAll}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform transform active:scale-95 flex items-center space-x-2"
              >
                <span>Processar {files.length} {files.length === 1 ? 'Arquivo' : 'Arquivos'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Carregamento */}
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-gray-500 font-medium animate-pulse">Lendo e salvando notas no banco de dados...</p>
          </div>
        )}

        {/* Avisos e Alertas (Erros ou Sucesso) */}
        {globalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center space-x-3 text-red-700">
            <AlertCircle />
            <p>{globalError}</p>
          </div>
        )}

        {/* Prévia dos Resultados Lidos da Nota */}
        {results.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Resultados do Processamento</h2>

            {results.map((res, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-4 border-b flex items-center space-x-3 ${res.success ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                  {res.success ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                  <div>
                    <h3 className="font-bold text-gray-800">{res.fileName}</h3>
                    <p className={`text-sm ${res.success ? 'text-green-700' : 'text-red-700'}`}>{res.message}</p>
                  </div>
                </div>

                {res.success && res.data && (
                  <div className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
                      <div className="p-4 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emitente</p>
                        <p className="font-semibold text-gray-900">{res.data.emitente.razaoSocial}</p>
                        <p className="text-xs text-gray-500">CNPJ: {res.data.emitente.cnpj}</p>
                      </div>
                      <div className="p-4 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destinatário</p>
                        <p className="font-semibold text-gray-900">{res.data.destinatario.razaoSocial}</p>
                        <p className="text-xs text-gray-500">CNPJ/CPF: {res.data.destinatario.cnpj}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700 mb-2">{res.data.produtos.length} Produtos Encontrados</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
