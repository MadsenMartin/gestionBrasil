import { ComboboxAPI } from "./ComboboxAPI";

interface ComboboxModelsProps {
    model: string;
    control: any;
    value?: number | string;
    initialLabel?: string;
    fieldToSend?: string;
    fieldToShow?: string;
    id?: string;
    className?: string;
    description?: string;
    queryParams?: string;
}

const modelFieldMappings: { [key: string]: { fieldToSend: string; fieldToShow: string } } = {
    marca: { fieldToSend: 'id', fieldToShow: 'nombre' },
    evento: { fieldToSend: 'id', fieldToShow: 'nombre' },
    categoria: { fieldToSend: 'id', fieldToShow: 'nombre' },
    subcategoria: { fieldToSend: 'id', fieldToShow: 'nombre' },
    caja: { fieldToSend: 'id', fieldToShow: 'nombre' },
    moneda: { fieldToSend: 'id', fieldToShow: 'nombre' },
    participante: { fieldToSend: 'id', fieldToShow: 'nombre' },
    formulario: { fieldToSend: 'id', fieldToShow: 'nombre' },
    proveedor: { fieldToSend: 'id', fieldToShow: 'nombre' },
}

export const ComboboxModels = (props: ComboboxModelsProps) => {
    const { model, control, value, initialLabel, fieldToSend, fieldToShow, id, className, description } = props;

    return (
        <div className="space-y-2">
            <ComboboxAPI
                model={model}
                control={control}
                value={value}
                initialLabel={initialLabel}
                fieldToSend={fieldToSend || modelFieldMappings[model]?.fieldToSend || 'id'}
                fieldToShow={fieldToShow || modelFieldMappings[model]?.fieldToShow || 'nombre'}
                description={description}
                id={id || model}
                className={className}
                queryParams={props.queryParams}
            />
        </div>
    );
};