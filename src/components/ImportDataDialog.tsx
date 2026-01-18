import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface FieldMapping {
  field: string;
  label: string;
  required?: boolean;
  type?: "string" | "number" | "date" | "phone" | "email" | "cpf";
}

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: FieldMapping[];
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>;
  templateData?: Record<string, string>[];
  templateFilename?: string;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "result";

export function ImportDataDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onImport,
  templateData,
  templateFilename = "template",
}: ImportDataDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setMappedData([]);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const parseFile = async (file: File): Promise<{ data: any[]; headers: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error("Arquivo deve ter pelo menos 2 linhas (cabeçalho + dados)"));
            return;
          }
          
          const headers = jsonData[0].map((h: any) => String(h || "").trim());
          const rows = jsonData.slice(1).filter((row: any[]) => row.some((cell: any) => cell != null && cell !== ""));
          
          const parsedData = rows.map((row: any[]) => {
            const obj: Record<string, any> = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] ?? "";
            });
            return obj;
          });
          
          resolve({ data: parsedData, headers });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    const isValid = validTypes.includes(selectedFile.type) || ["xlsx", "xls", "csv"].includes(extension || "");
    
    if (!isValid) {
      toast({
        title: "Formato inválido",
        description: "Selecione um arquivo Excel (.xlsx, .xls) ou CSV",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setFile(selectedFile);
      const { data, headers: fileHeaders } = await parseFile(selectedFile);
      setRawData(data);
      setHeaders(fileHeaders);
      
      // Auto-map columns with matching names
      const autoMapping: Record<string, string> = {};
      fields.forEach((field) => {
        const matchingHeader = fileHeaders.find(
          (h) => h.toLowerCase() === field.label.toLowerCase() || h.toLowerCase() === field.field.toLowerCase()
        );
        if (matchingHeader) {
          autoMapping[field.field] = matchingHeader;
        }
      });
      setMapping(autoMapping);
      
      setStep("mapping");
    } catch (error: any) {
      toast({
        title: "Erro ao processar arquivo",
        description: error.message || "Não foi possível ler o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleMappingChange = (field: string, header: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: header === "_none_" ? "" : header,
    }));
  };

  const validateMapping = (): boolean => {
    const requiredFields = fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !mapping[f.field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Mapeie os campos: ${missingFields.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const processMapping = () => {
    if (!validateMapping()) return;
    
    const processed = rawData.map((row) => {
      const mapped: Record<string, any> = {};
      fields.forEach((field) => {
        const header = mapping[field.field];
        if (header) {
          let value = row[header];
          
          // Type conversion
          if (field.type === "number" && value != null) {
            value = parseFloat(String(value).replace(",", ".")) || 0;
          } else if (field.type === "phone" && value) {
            value = String(value).replace(/\D/g, "");
            if (value.length === 11) {
              value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
          }
          
          mapped[field.field] = value;
        }
      });
      return mapped;
    });
    
    setMappedData(processed);
    setStep("preview");
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);
    
    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await onImport(mappedData);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep("result");
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar os dados",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = fields.reduce((acc, f) => {
      acc[f.label] = "";
      return acc;
    }, {} as Record<string, string>);
    
    const data = templateData || [
      templateHeaders,
      fields.reduce((acc, f) => {
        acc[f.label] = f.type === "number" ? "0" : f.type === "phone" ? "(00) 00000-0000" : "Exemplo";
        return acc;
      }, {} as Record<string, string>),
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `${templateFilename}.xlsx`);
    
    toast({
      title: "Template baixado!",
      description: "Preencha o template e faça upload novamente.",
    });
  };

  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Arraste ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceitos: Excel (.xlsx, .xls) ou CSV
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted-foreground">ou</span>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Baixar template de exemplo
            </Button>
          </div>
        );
      
      case "mapping":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{file?.name}</span>
              <Badge variant="secondary">{rawData.length} registros</Badge>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {fields.map((field) => (
                <div key={field.field} className="flex items-center gap-3">
                  <div className="w-1/3">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={mapping[field.field] || "_none_"}
                    onValueChange={(v) => handleMappingChange(field.field, v)}
                  >
                    <SelectTrigger className="w-2/3">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">-- Ignorar --</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={processMapping} className="flex-1">
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case "preview":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Prévia dos dados</span>
              <Badge>{mappedData.length} registros para importar</Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[250px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fields.filter((f) => mapping[f.field]).map((field) => (
                        <TableHead key={field.field} className="whitespace-nowrap">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {fields.filter((f) => mapping[f.field]).map((field) => (
                          <TableCell key={field.field} className="whitespace-nowrap">
                            {String(row[field.field] ?? "-")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {mappedData.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 5 de {mappedData.length} registros
              </p>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("mapping")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleImport} className="flex-1">
                Importar {mappedData.length} registros
              </Button>
            </div>
          </div>
        );
      
      case "importing":
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importando dados...</p>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {importProgress}% concluído
            </p>
          </div>
        );
      
      case "result":
        return (
          <div className="space-y-6 py-4">
            {importResult && (
              <>
                <div className="flex flex-col items-center gap-4">
                  {importResult.success > 0 ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-destructive" />
                  )}
                  <div className="text-center">
                    <p className="text-xl font-semibold">
                      {importResult.success} registro(s) importado(s)
                    </p>
                    {importResult.errors.length > 0 && (
                      <p className="text-destructive mt-1">
                        {importResult.errors.length} erro(s)
                      </p>
                    )}
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-h-[150px] overflow-auto">
                    <p className="font-medium text-destructive mb-2">Erros encontrados:</p>
                    <ul className="text-sm space-y-1">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="text-destructive/80">• {error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-destructive/60">
                          ...e mais {importResult.errors.length - 10} erro(s)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                <Button onClick={handleClose} className="w-full">
                  Fechar
                </Button>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
