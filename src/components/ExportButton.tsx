import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showDropdown?: boolean;
}

export function ExportButton({
  data,
  filename,
  columns,
  variant = "outline",
  size = "default",
  className,
  showDropdown = true,
}: ExportButtonProps) {
  const { toast } = useToast();

  const prepareData = () => {
    if (!columns) return data;
    
    return data.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        row[col.label] = item[col.key] ?? "";
      });
      return row;
    });
  };

  const exportToExcel = () => {
    try {
      const exportData = prepareData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws["!cols"] = colWidths;
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
      
      toast({
        title: "Exportação concluída!",
        description: `${data.length} registro(s) exportado(s) para Excel.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    try {
      const exportData = prepareData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exportação concluída!",
        description: `${data.length} registro(s) exportado(s) para CSV.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  if (!showDropdown) {
    return (
      <Button variant={variant} size={size} className={className} onClick={exportToExcel}>
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="mr-2 h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
