import express from 'express';
import bodyParser from 'body-parser';
import { Task, User, Images, Project } from '@/app/controllers/index.js';
import { initialize } from '@/utils/initialize';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './swaggerOutput.json';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(Task);
app.use(User);
app.use(Images);
app.use(Project);
initialize();

console.log(`Servidor rodando no link http://localhost:${port}`);
app.listen(port);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));