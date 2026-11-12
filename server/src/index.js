import app from './app.js';
import { env } from './config.js';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Signal Room server listening on http://0.0.0.0:${env.port}`);
});
