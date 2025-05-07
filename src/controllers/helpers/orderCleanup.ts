import cron from 'node-cron';
import pool from './pool';

// Programa un cron job para ejecutarse cada hora (puedes ajustar la frecuencia)
cron.schedule('0 * * * *', async () => {
    try {
      const result = await pool.query(`
        DELETE FROM f_pcl
        WHERE estado = 'PENDIENTE'
          AND fecpcl < NOW() - INTERVAL '24 hours'
      `);
      const deletedCount = result.rowCount ?? 0;
      if (deletedCount > 0) {
        console.log(`Se eliminaron ${deletedCount} pedidos pendientes de más de 24 horas.`);
      }
    } catch (err) {
      console.error('Error al eliminar pedidos pendientes:', err);
    }
  });
  