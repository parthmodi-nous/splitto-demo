'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import currency from 'currency.js';
import { Check, ChevronDown, Search } from 'lucide-react';
import { CURRENCY_LIST, getCurrency } from '@/lib/currencies';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency: string;
  onCurrencyChange?: (currency: string) => void;
  showCurrencySelector?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency: currencyCode,
  onCurrencyChange,
  showCurrencySelector = true,
  placeholder = '0.00',
  disabled = false,
  className,
}: CurrencyInputProps) {
  const currencyInfo = getCurrency(currencyCode);
  const [inputValue, setInputValue] = useState<string>(
    value > 0
      ? currencyInfo.decimalPlaces === 0
        ? String(Math.round(value))
        : value.toFixed(currencyInfo.decimalPlaces)
      : ''
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes into the text input when value resets to 0
  useEffect(() => {
    if (value === 0) {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow digits, one dot, leading minus (for future use) — strip anything else
      const sanitized = raw.replace(/[^0-9.]/g, '');
      setInputValue(sanitized);

      if (sanitized === '' || sanitized === '.') {
        onChange(0);
        return;
      }

      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed)) {
        if (currencyInfo.decimalPlaces === 0) {
          onChange(Math.round(parsed));
        } else {
          onChange(currency(parsed, { precision: currencyInfo.decimalPlaces }).value);
        }
      }
    },
    [onChange, currencyInfo]
  );

  const handleBlur = useCallback(() => {
    if (inputValue === '' || inputValue === '.') {
      setInputValue('');
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const formatted =
        currencyInfo.decimalPlaces === 0
          ? String(Math.round(parsed))
          : parsed.toFixed(currencyInfo.decimalPlaces);
      setInputValue(formatted);
    }
  }, [inputValue, currencyInfo]);

  const handleCurrencySelect = useCallback(
    (code: string) => {
      onCurrencyChange?.(code);
      setPickerOpen(false);
      setSearch('');
      // Re-format existing value for new currency decimal places
      const newInfo = getCurrency(code);
      if (value > 0) {
        const reformatted =
          newInfo.decimalPlaces === 0
            ? String(Math.round(value))
            : value.toFixed(newInfo.decimalPlaces);
        setInputValue(reformatted);
      }
    },
    [onCurrencyChange, value]
  );

  const filteredCurrencies = CURRENCY_LIST.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn('flex items-stretch rounded-md border border-input bg-background', className)}>
      {showCurrencySelector && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-3 py-2 border-r border-input text-sm font-medium rounded-l-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="font-semibold">{currencyInfo.symbol}</span>
              <span className="text-muted-foreground">{currencyCode}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="flex items-center border-b border-border px-3 py-2 gap-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search currencies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredCurrencies.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No currencies found.</p>
              ) : (
                filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencySelect(c.code)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                      c.code === currencyCode && 'bg-accent'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-8 text-center font-semibold text-muted-foreground">
                        {c.symbol}
                      </span>
                      <span>
                        <span className="font-medium">{c.code}</span>
                        <span className="ml-1.5 text-muted-foreground">{c.name}</span>
                      </span>
                    </span>
                    {c.code === currencyCode && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          showCurrencySelector ? 'rounded-r-md' : 'rounded-md'
        )}
      />
    </div>
  );
}
