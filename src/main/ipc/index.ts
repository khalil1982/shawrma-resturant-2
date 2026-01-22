import { DatabaseService } from '../database/database.service';
import { registerAuthHandlers } from './auth.handler';
import { registerShiftHandlers } from './shift.handler';
import { registerItemHandlers } from './item.handler';
import { registerOrderHandlers } from './order.handler';

export function registerIpcHandlers(dbService: DatabaseService) {
  const db = dbService.getDatabase();

  // Register all handlers
  registerAuthHandlers(db);
  registerShiftHandlers(db);
  registerItemHandlers(db);
  registerOrderHandlers(db);

  console.log('All IPC handlers registered');
}
