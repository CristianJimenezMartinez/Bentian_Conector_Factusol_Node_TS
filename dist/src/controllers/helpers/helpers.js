"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
exports.safeValue = safeValue;
function sanitize(value) {
    if (!value)
        return '';
    return value.replace(/'/g, "''");
}
function safeValue(value) {
    if (Buffer.isBuffer(value)) {
        try {
            return value.toString('utf8');
        }
        catch (e) {
            try {
                return value.toString('latin1');
            }
            catch (err) {
                console.error('No se pudo convertir el buffer, asignando valor por defecto', err);
                return null;
            }
        }
    }
    return value;
}
