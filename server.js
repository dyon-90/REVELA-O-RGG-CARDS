import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app, server } = require('./server.cjs');

export { app, server };
