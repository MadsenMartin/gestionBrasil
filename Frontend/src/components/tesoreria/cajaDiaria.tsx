import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { comboboxField } from "../documentos/formNuevoDocumento";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { ComboboxAPI } from "../comboboxes/ComboboxAPI";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";

const movimientos = z.object({
  fecha: z.string().min(1, { message: "Campo requerido" }),
  proveedor: comboboxField(),
  obra: comboboxField(),
  descripcion: z.string().min(1, { message: "Campo requerido" }),
  entrada: z.coerce.number().min(0, { message: "Campo requerido" }),
  salida: z.coerce.number().min(0, { message: "Campo requerido" }),
  plantilla: comboboxField()
});

const getCurrentDate = () => new Date().toISOString().split("T")[0];

const formSchema = z.object({
  movimientos: z.array(movimientos),
})

type FormValues = z.infer<typeof formSchema>;

export function CajaDiaria({ trigger }: { trigger: React.ReactNode }) {

  const [open, setOpen] = useState(false);
  const [comboboxLabels, setComboboxLabels] = useState<{ [key: string]: string }>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movimientos: [{
        fecha: getCurrentDate(),
        proveedor: 0,
        obra: 0,
        descripcion: "",
        entrada: 0,
        salida: 0,
        plantilla: 0
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "movimientos",
    control: form.control,
  });

  const handleAgregarMovimiento = () => {
    append({
      fecha: getCurrentDate(),
      proveedor: 0,
      obra: 0,
      descripcion: "",
      entrada: 0,
      salida: 0,
      plantilla: 0
    });
  }

  const onOpen = () => {
    const movimientosData = localStorage.getItem("movimientos");
    const labelsData = localStorage.getItem("movimientos_labels"); // Get labels string

    if (movimientosData) {
      try {
        const parsedMovimientos = JSON.parse(movimientosData);
          form.reset({ movimientos: parsedMovimientos }); // Use reset to update form state correctly

          // Parse and set labels state
          if (labelsData) {
            try {
              const parsedLabels = JSON.parse(labelsData);
              setComboboxLabels(parsedLabels); // Set the state
            } catch (labelError) {
              console.error("Error parsing movimientos_labels from localStorage:", labelError);
              setComboboxLabels({}); // Reset to empty if parsing fails
            }
          } else {
            setComboboxLabels({}); // Reset if no labels found
          }
    } catch (error) {
        console.error("Error parsing movimientos from localStorage:", error);
        form.reset(); // Reset form if parsing fails
      }
    setOpen(true); // Open the dialog after attempting to load data
  };
  
    }

  const onClose = () => {
    const currentData = form.getValues();
      localStorage.setItem("movimientos", JSON.stringify(currentData.movimientos));
      // Guardar los labels de los comboboxes en el localStorage
      localStorage.setItem("movimientos_labels", JSON.stringify(comboboxLabels));
      setOpen(false);
  }

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    } else {
      onOpen();
    }
  }

  const onSubmit = async (data: FormValues) => {
    console.log(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1800px]">
        <DialogHeader>
          <DialogTitle>Carga de movimientos diarios</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form id="nuevo_pago_mdo" onSubmit={form.handleSubmit(onSubmit)}>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Fecha</TableHead>
              <TableHead className="text-center">Proveedor</TableHead>
              <TableHead className="text-center">Obra</TableHead>
              <TableHead className="text-center">Descripción</TableHead>
              <TableHead className="text-center">Entrada</TableHead>
              <TableHead className="text-center">Salida</TableHead>
              <TableHead className="text-center">Saldo</TableHead>
              <TableHead className="text-center">Plantilla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell className="text-center">
                  <FormField
                    control={form.control}
                    name={`movimientos.${index}.fecha`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="max-w-fit"
                          />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <ComboboxAPI
                    id={`movimientos.${index}.proveedor`}
                    model="proveedores"
                    fieldToShow="nombre"
                    fieldToSend="id"
                    onItemChange={(value) => {
                      setComboboxLabels(prev => ({
                        ...prev,
                        [`movimientos.${index}.proveedor`]: value? value['nombre'] : ""
                      }));
                    }}
                    initialLabel={comboboxLabels[`movimientos.${index}.proveedor`] || ""}
                    control={form.control}
                    className="w-full"
                    formLabel={false}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <ComboboxAPI
                    id={`movimientos.${index}.obra`}
                    model="clientes_proyectos"
                    fieldToShow="cliente_proyecto"
                    fieldToSend="id"
                    onItemChange={(value) => {
                      setComboboxLabels(prev => ({
                        ...prev,
                        [`movimientos.${index}.obra`]: value ? value['cliente_proyecto']: ""
                      }));
                    }}
                     // Read from state for initialLabel
                    initialLabel={comboboxLabels[`movimientos.${index}.obra`] || ""}
                    control={form.control}
                    formLabel={false}
                    className="w-full"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <FormField
                    control={form.control}
                    name={`movimientos.${index}.descripcion`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <FormField
                    control={form.control}
                    name={`movimientos.${index}.entrada`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <FormField
                    control={form.control}
                    name={`movimientos.${index}.salida`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Label className="text-center">Saldo</Label>
                  </TableCell>
                <TableCell className="text-center">
                  <ComboboxAPI
                    id={`movimientos.${index}.plantilla`}
                    model="plantillas_registros"
                    fieldToShow="nombre"
                    fieldToSend="id"
                    onItemChange={(value) => {
                      setComboboxLabels(prev => ({
                        ...prev,
                        [`movimientos.${index}.plantilla`]: value ? value['nombre'] : ""
                      }));
                    }}
                     // Read from state for initialLabel
                    initialLabel={comboboxLabels[`movimientos.${index}.plantilla`] || ""}
                    control={form.control}
                    className="w-full"
                    formLabel={false}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="destructive" onClick={() => remove(index)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <Button onClick={handleAgregarMovimiento}>{<Plus />}</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </form>
        </Form>
      </DialogContent>
    </Dialog>

  );
}