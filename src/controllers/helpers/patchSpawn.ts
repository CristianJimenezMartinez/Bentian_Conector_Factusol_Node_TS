import * as child_process from 'child_process';

// Guarda la función original
const originalSpawn = child_process.spawn;

// Sobrescribe la propiedad "spawn" usando Object.defineProperty
Object.defineProperty(child_process, 'spawn', {
  value: function(command: string, args: string[], options: any) {
    const child = originalSpawn(command, args, options);
    if (child.stdout) {
      // Forzar codificación a UTF-8
      child.stdout.setEncoding('utf8');
      const originalOn = child.stdout.on.bind(child.stdout);
      child.stdout.on = function(event: string, listener: (data: any) => any): any {
        if (event === 'data') {
          originalOn(event, (data: Buffer | string) => {
            try {
              const str = Buffer.isBuffer(data) ? data.toString('utf8') : data;
              listener(str);
            } catch (e) {
              console.warn(`Error al transcodificar datos del proceso hijo (${command}): se omiten esos datos.`, e);
              // Se ignoran los datos problemáticos
            }
          });
        } else {
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
