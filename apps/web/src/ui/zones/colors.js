export function zoneColor(type) {
    switch (type) {
        case 'FREE_EDIT':
            return { stroke: '#0ea5e9', fill: 'rgba(14,165,233,0.10)' };
        case 'LOCKED_ZONE':
            return { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.12)' };
        case 'REVIEW_REQUIRED':
            return { stroke: '#a855f7', fill: 'rgba(168,85,247,0.12)' };
        case 'READ_ONLY':
            return { stroke: '#64748b', fill: 'rgba(100,116,139,0.10)' };
        default:
            return { stroke: '#64748b', fill: 'rgba(100,116,139,0.10)' };
    }
}
