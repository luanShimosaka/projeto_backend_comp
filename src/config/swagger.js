const swaggerAutogen = require('swagger-autogen')()

const doc = {
  info: {
    version: '1.0.0',
    title: 'Projeto Trainee Backend - API',
    description:
      'Projeto para capacitação trainee de backend, com o objetivo de criar uma API para gerenciar projetos e tarefas.',
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http'],
  consumes: ['application/json', 'multipart/form-data'],
  produces: ['application/json'],
  tags: [
    {
      name: 'User',
      description: 'Rota de usuário',
    },
    {
      name: 'Task',
      description: 'Rota de tarefas',
    },
    {
      name: 'Project',
      description: 'Rota de projetos',
    },
    {
      name: 'Images',
      description: 'Rotas de imagens',
    },
  ],
  securityDefinitions: {
    bearer_token: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'bearer_token',
      in: 'header',
    },
  },
  definitions: {
    user: {
      $name: 'Usuário 1',
      $email: 'email@compjuinior.com.br',
      $password: '123456',
      passwordResetToken: '123456',
      passwordResetTokenExpiration: '2021-08-31T00:00:00.000Z',
      isAdmin: false,
      isMod: false,
      image: 'https://i.imgur.com/1.jpg',
      createdAt: '2021-08-31T00:00:00.000Z',
    },
    project: {
      $name: 'Projeto 1',
      $description: 'Descrição do projeto 1',
      $client: 'Cliente 1',
      deadline: '2021-08-31T00:00:00.000Z',
      featuredImage: 'https://i.imgur.com/1.jpg',
      tasks: [],
      squad: [],
      files: ['https://i.imgur.com/1.jpg'],
      createdAt: '2021-08-31T00:00:00.000Z',
      complete: false,
      completedAt: '2021-08-31T00:00:00.000Z',
    },
    task: {
      $name: '1',
      $description: 'Descrição da tarefa 1',
      $category: 'Desenvolvimento',
      deadline: '2021-08-31T00:00:00.000Z',
      status: 'Não iniciado',
      $projectId: 1,
      featuredImage: 'https://i.imgur.com/1.jpg',
      files: ['https://i.imgur.com/1.jpg'],
      createdAt: '2021-08-31T00:00:00.000Z',
      completedAt: '2021-08-31T00:00:00.000Z',
    },
  },
}

const outputFile = './src/swaggerOutput.json'
const endpointsFiles = ['./src/app/controllers/*.js']

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('../index.js')
})
