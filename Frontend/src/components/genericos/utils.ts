export const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

export const formatDate = (dateString: string) => {
        return dateString?.split('-').reverse().join('/')
    }