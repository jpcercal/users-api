import app from './app';
import { initialiseDataSource } from './app-data-source';

const port = process.env.PORT || 3000;

initialiseDataSource().then((initialised): void => {
  if (!initialised) {
    console.error('Could not connect to the database');
    return;
  }

  console.log('Database connection established');

  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});
