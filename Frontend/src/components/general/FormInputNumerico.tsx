import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "../ui/input"

interface FormInputNumericoProps {
    control: any;
    name: string;
    label: string;
    inputMode?: "numeric" | "decimal";
    type?: "number" | "text" | "date";
}

export function FormInput({ control, name, label, inputMode, type }: FormInputNumericoProps) {

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            type={type}
                            {...field}
                            inputMode={inputMode}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    field.onChange('');
                                } else {
                                    field.onChange(inputMode !== 'decimal' ? Number(value) : value);
                                }
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}