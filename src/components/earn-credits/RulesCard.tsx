import { Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RulesCard() {
  const rules = [
    "Max 10 videos per day",
    "Max 200 credits per day",
    "Credits added only after full completion",
    "First video each day: +5 bonus credits!",
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
