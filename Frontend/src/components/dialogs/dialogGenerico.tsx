import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface DialogGenericoProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    open?: boolean;
    setOpen?: (open: boolean) => void;
    className?: string;
}

export function DialogGenerico({trigger, title, description, children, open, setOpen, className}: DialogGenericoProps){
    const [_open, _setOpen] = open !== undefined && setOpen ? [open, setOpen] : useState(false);
    return (
        <Dialog open={_open} onOpenChange={_setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className={className}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}