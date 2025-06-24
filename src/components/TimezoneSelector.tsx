
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from 'lucide-react';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  selectedTimezone,
  onTimezoneChange,
}) => {
  const timezones = [
    { value: 'auto', label: 'Auto-detect location' },
    { value: 'America/Chicago', label: 'Chicago Time (CT)' },
    { value: 'Asia/Jakarta', label: 'Jakarta Time (WIB)' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
        <SelectTrigger className="w-40 sm:w-48 bg-white/80 backdrop-blur-sm border-white/20">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {timezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
