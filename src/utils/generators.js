export const generateAnalysisCode = (name) => {
    if (!name) return 'ANA-' + Math.floor(100 + Math.random() * 900);
    const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'ANA';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomNum}`;
};
