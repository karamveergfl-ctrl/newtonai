import { Check, X, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { featureComparison, competitors, CompetitorKey } from "@/pages/compare/competitorData";

interface ComparisonTableProps {
  competitor: CompetitorKey;
}

const ComparisonTable = ({ competitor }: ComparisonTableProps) => {
  const competitorData = competitors[competitor];

  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-red-500 mx-auto" />;
    }
    return <span className="text-sm text-muted-foreground">{value}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-x-auto"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px] font-semibold">Feature</TableHead>
            <TableHead className="text-center font-semibold text-primary">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🧠</span>
                <span>NewtonAI</span>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{competitorData.logo}</span>
                <span>{competitorData.name}</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {featureComparison.map((row, index) => (
            <TableRow 
              key={row.feature}
              className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
            >
              <TableCell className="font-medium">{row.feature}</TableCell>
              <TableCell className="text-center">{renderValue(row.newton)}</TableCell>
              <TableCell className="text-center">{renderValue(row[competitor])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
};

export default ComparisonTable;
