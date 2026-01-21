import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV, type CsvColumn } from "@/utils/csvExport";
import { toast } from "sonner";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: CsvColumn[];
  filename: string;
  disabled?: boolean;
}

export function ExportButton({
  data,
  columns,
  filename,
  disabled = false,
}: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      downloadCSV(data, columns, filename);
      toast.success(`Exported ${data.length} records`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
