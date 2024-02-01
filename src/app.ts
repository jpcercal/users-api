import 'reflect-metadata';
import express, { Express } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import { UserRouter } from './routes/user.route';
import { OpenApiValidator } from './middlewares/openapi.middleware';

dotenv.config();

const app: Express = express();

app.use(cors());
app.use(express.json());
app.options('*', cors());
app.use(OpenApiValidator);
app.use('/users', UserRouter);
app.use(errorHandler);

export default app;
