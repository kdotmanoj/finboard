export const formatValue = (value, type) => {
    if (value === undefined || value === null || value === '--') return '--';
    const num = parseFloat(value);
    if (isNaN(num)) return value; 

    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
        case 'percentage':
            return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}%`;
        case 'number':
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
        default:
            return value;
    }
};