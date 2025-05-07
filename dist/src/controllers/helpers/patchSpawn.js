"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = __importStar(require("child_process"));
// Guarda la función original
const originalSpawn = child_process.spawn;
// Sobrescribe la propiedad "spawn" usando Object.defineProperty
Object.defineProperty(child_process, 'spawn', {
    value: function (command, args, options) {
        const child = originalSpawn(command, args, options);
        if (child.stdout) {
            // Forzar codificación a UTF-8
            child.stdout.setEncoding('utf8');
            const originalOn = child.stdout.on.bind(child.stdout);
            child.stdout.on = function (event, listener) {
                if (event === 'data') {
                    originalOn(event, (data) => {
                        try {
                            const str = Buffer.isBuffer(data) ? data.toString('utf8') : data;
                            listener(str);
                        }
                        catch (e) {
                            console.warn(`Error al transcodificar datos del proceso hijo (${command}): se omiten esos datos.`, e);
                            // Se ignoran los datos problemáticos
                        }
                    });
                }
                else {
                    originalOn(event, listener);
                }
                return child.stdout;
            };
        }
        return child;
    },
    configurable: true,
    writable: false
});
