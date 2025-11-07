export function AyudaTablaDocumentos() {
    return (
        <div className="text-sm text-gray-700 dark:text-gray-300">
            <p>En esta tabla se muestran los documentos cargados en el sistema.</p>
            <p>Puede filtrar por tipo de documento, número, fecha y otros criterios.</p>
            <p>Para cargar un nuevo documento, haga clic en el botón "Cargar Documento" y seleccione el archivo correspondiente.</p>
            <p>También puede editar o eliminar documentos existentes utilizando las acciones disponibles en cada fila.</p>
            <p>Las lineas que se muestran en color verde representan documentos que han sido imputados. Esto significa que el documento tiene por lo menos un registro de caja asociado. Aunque generalmente suele ser el caso, puede no representar la cancelación del total del mismo</p>
        </div>
    );
}