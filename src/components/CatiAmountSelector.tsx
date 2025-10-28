import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CatiAmountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  presetAmounts?: number[];
  label?: string;
}

const defaultPresetAmounts = [10, 100, 1000];

export function CatiAmountSelector({
  value,
  onChange,
  presetAmounts = defaultPresetAmounts,
  label = 'CATI amount',
}: CatiAmountSelectorProps) {
  return (
    <div className="mb-4">
      {/* Combined amount input with preset buttons */}
      <div className="flex items-center gap-2 mb-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Input the ${label} you want to send`}
          className="flex-1"
          min="1"
        />
        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
          CATI
        </div>
      </div>
      {/* Preset amount buttons that populate the input */}
      <div className="flex gap-2">
        {presetAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            onClick={() => onChange(amount.toString())}
            className={`flex-1 ${
              value === amount.toString()
                ? 'bg-gray-300 border-gray-300 text-gray-700'
                : 'bg-gray-100 border-gray-100 text-gray-700'
            } hover:bg-gray-300`}
          >
            {amount} CATI
          </Button>
        ))}
      </div>
    </div>
  );
}

export default CatiAmountSelector;
