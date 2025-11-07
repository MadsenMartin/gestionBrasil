import { forwardRef, useEffect, useState } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Input } from './input';

export interface NumberInputProps
  extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      thousandSeparator = ',',
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 2,
      suffix,
      prefix = '$',
      value: controlledValue,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState<number | undefined>(
      controlledValue ?? defaultValue
    );

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue;
      setValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min);
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(min);
        } else if (value > max) {
          setValue(max);
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(max);
        }
      }
    };

    return (
      <div className="flex items-center">
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative"
          getInputRef={ref}
          {...props}
        />
      </div>
    );
  }
);
