import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function SkeletonListPresupuestosCliente() {
            return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-32" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-10 w-48" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }