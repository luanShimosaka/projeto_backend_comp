import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import Project from '@/app/schemas/project'
import Task from '@/app/schemas/task'
import User from '@/app/schemas/user'
import AuthMid from '@/app/middlewares/auth'
import AuthAdmin from '@/app/middlewares/admin'
import AuthMod from '@/app/middlewares/moderator'
import Multer from '@/app/middlewares/multerProject'
import MulterFiles from '@/app/middlewares/multerProjectFiles'

const router = new Router()

router.get('/project', AuthMid, (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para retornar todos os projetos não concluídos'
  //#swagger.security = [{ "bearer_token": [] }]

  Project.find()
    .then((data) => {
      const projects = data.filter((project) => !project.completed)
      projects.forEach((project) => {
        project.image = undefined
      })
      res.status(200).send(projects)
      /* #swagger.responses[200] = {
        description: 'Projetos encontrados.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao obter a projeto no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível obter os dados da sua projeto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

router.get('/project/:projectId', AuthMid, (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para retornar um projeto'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  Project.findById(req.params.projectId)
    .populate(['task', 'squad'])
    .then((project) => {
      res.status(200).send(project)
      /* #swagger.responses[200] = {
        description: 'Projeto encontrado.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao obter o produto no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível obter os dados do seu produto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

router.post('/project', [AuthMid, AuthAdmin], (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para cadastrar um projeto'
  //#swagger.parameters['name', 'description', 'client', 'deadline', 'tasks', 'squad'] = { description: 'Dados do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const { name, description, client, deadline, tasks, squad } = req.body
  const absolutePath = 'upload/projects'
  const folderName = name
  const completePath = path.join(absolutePath, folderName)
  const foldersToCreate = [
    completePath,
    path.join(completePath, 'featuredImage'),
    path.join(completePath, 'files'),
    path.join(completePath, 'tasks'),
  ]

  Project.create({ name, description, client, deadline, tasks, squad })
    .then(async (project) => {
      await Promise.all(
        foldersToCreate.map((folder) => fs.promises.mkdir(folder))
      )
      res.status(200).send(project)
      /* #swagger.responses[200] = {
        description: 'Projeto e pastas criado com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao criar projeto e pastas:', error)
      res.status(400).send({
        error:
          'Não foi possível criar o projeto e as pastas, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao criar projeto e pastas.'
      } */
    })
})

router.post(
  '/project/featured-image/:projectId',
  [AuthMid, AuthMod, Multer.single('featuredImage')],
  (req, res) => {
    //#swagger.tags = ['Project']
    //#swagger.description = 'Endpoint para cadastrar uma imagem de destaque do projeto'
    //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const { file } = req
    if (file) {
      Project.findById(req.params.projectId).then((project) => {
        if (project.featuredImage) {
          fs.unlink(project.featuredImage, (error) => {
            if (error) {
              console.error('Erro ao excluir o arquivo existente', error)
            }
          })
        }
      })
      Project.findByIdAndUpdate(
        req.params.projectId,
        {
          $set: {
            featuredImage: file.path,
          },
        },
        { new: true }
      )
        .then((project) => {
          return res.status(200).send({ project })
          /* #swagger.responses[200] = {
            description: 'Imagem enviada com sucesso.'
          } */
        })
        .catch((error) => {
          console.error('Erro ao associar imagem ao projeto', error)
          res.status(500).send({ error: 'Erro ao enviar imagem' })
          /* #swagger.responses[500] = {
            description: 'Erro ao enviar imagem.'
          } */
        })
    } else {
      return res.status(400).send({ error: 'Não foi possível enviar a imagem' })
      /* #swagger.responses[400] = {
        description: 'Erro ao enviar imagem.'
      } */
    }
  }
)

router.post(
  '/project/files/:projectId',
  [AuthMid, AuthMod, MulterFiles.array('files')],
  (req, res) => {
    //#swagger.tags = ['Project']
    //#swagger.description = 'Endpoint para cadastrar arquivos do projeto'
    //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const { files } = req
    Project.findById(req.params.projectId)
      .then((project) => {
        let filesArray = []
        if (files && files.length > 0) {
          files.forEach((file) => {
            if (!project.files.includes(file.path)) {
              filesArray.push(file.path)
            }
          })
        }
        Project.findByIdAndUpdate(
          req.params.projectId,
          {
            $push: {
              files: {
                $each: filesArray,
              },
            },
          },
          { new: true }
        )
          .then((project) => {
            return res.status(200).send({ project })
            /* #swagger.responses[200] = {
              description: 'Arquivo enviado com sucesso.'
            } */
          })
          .catch((error) => {
            console.error('Erro ao associar imagem ao projeto', error)
            res.status(500).send({ error: 'Erro ao enviar imagem' })
            /* #swagger.responses[500] = {
              description: 'Erro ao enviar arquivo.'
            } */
          })
      })
      .catch((error) => {
        console.error('Erro ao encontrar o projeto', error)
        res.status(404).send({ error: 'Projeto não encontrado' })
        /* #swagger.responses[404] = {
          description: 'Erro ao encontrar projeto.'
        } */
      })
  }
)

router.put('/project/:projectId', [AuthMid, AuthAdmin], async (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para atualizar um projeto'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const { name, description, client, deadline, tasks, squad } = req.body

  Project.findById(req.params.projectId)
    .then((project) => {
      if (project == null) {
        return res.status(404).send({
          error: 'Projeto inexistente.',
        })
        /* #swagger.responses[404] = {
          description: 'Erro ao encontrar projeto.'
        } */
      }

      const invalidTasks = []
      const asyncPromisesTask = tasks
        ? tasks.map((task) => {
            return Task.exists({ _id: task }).then((doc) => {
              if (!doc) {
                invalidTasks.push(task)
              }
            })
          })
        : []
      Promise.all(asyncPromisesTask)
        .then(() => {
          const invalidUsers = []
          const asyncPromisesUser = squad
            ? squad.map((user) => {
                return User.exists({ _id: user }).then((doc) => {
                  if (!doc) {
                    invalidUsers.push(user)
                  }
                })
              })
            : []
          Promise.all(asyncPromisesUser)
            .then(() => {
              if (invalidTasks.length > 0 || invalidUsers.length > 0) {
                return res.status(400).send({
                  error:
                    'Algumas das tasks ou usuários inseridos são inválidos.',
                  invalidTasks,
                  invalidUsers,
                })
                /* #swagger.responses[400] = {
                  description: 'Erro ao atualizar projeto.'
                } */
              }
              Project.findByIdAndUpdate(
                req.params.projectId,
                { name, description, client, deadline, tasks, squad },
                { new: true }
              ).then((project) => {
                res.status(200).send({ project })
                /* #swagger.responses[200] = {
                  description: 'Projeto atualizado com sucesso.'
                } */
              })
            })
            .catch((error) => {
              console.error(error)
              res.status(400).send({
                error:
                  'Não foi possível atualizar seu projeto, verifique os dados e tente novamente.',
              })
              /* #swagger.responses[400] = {
                description: 'Erro ao atualizar projeto.'
              } */
            })
        })
        .catch((error) => {
          console.error(error)
          res.status(400).send({
            error:
              'Não foi possível atualizar seu projeto, verifique os dados e tente novamente.',
          })
          /* #swagger.responses[400] = {
            description: 'Erro ao atualizar projeto.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao encontrar o projeto no banco de dados.', error)
      res.status(404).send({
        error:
          'Não foi possível encontrar seu projeto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[404] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

router.put('/project/complete/:projectId', [AuthMid, AuthAdmin], (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para concluir um projeto'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const complete = true
  const completedAt = Date.now()
  Project.findByIdAndUpdate(
    req.params.projectId,
    { complete, completedAt },
    { new: true }
  )
    .then((project) => {
      res.status(200).send(project)
      /* #swagger.responses[200] = {
        description: 'Projeto concluído com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao atualizar o projeto no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível atualizar seu projeto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao atualizar projeto.'
      } */
    })
})

router.delete(
  '/project/featured-image/:projectId',
  [AuthMid, AuthMod],
  (req, res) => {
    //#swagger.tags = ['Project']
    //#swagger.description = 'Endpoint para excluir a imagem de destaque do projeto'
    //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const projectId = req.params.projectId

    Project.findById(projectId)
      .then((project) => {
        const fileName = project.featuredImage
        fs.unlinkSync(fileName)
        project.featuredImage = undefined
        project.save()
        res.status(200).send(project)
        /* #swagger.responses[200] = {
          description: 'Imagem deletada com sucesso.'
        } */
      })
      .catch((error) => {
        console.error('Erro ao encontrar o projeto.', error)
        res
          .status(400)
          .send({ message: 'Erro ao encontrar o projeto, tente novamente.' })
        /* #swagger.responses[400] = {
          description: 'Erro ao encontrar projeto.'
        } */
      })
  }
)

router.delete(
  '/project/:projectId/:fileName',
  [AuthMid, AuthMod],
  (req, res) => {
    //#swagger.tags = ['Project']
    //#swagger.description = 'Endpoint para excluir um arquivo do projeto'
    //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
    //#swagger.parameters['fileName'] = { description: 'Nome do arquivo.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const projectId = req.params.projectId
    const fileName = req.params.fileName

    Project.findById(projectId)
      .then((project) => {
        const completePath = path.join(
          'upload/projects/' + project.name + '/files/' + fileName
        )
        const files = project.files
        let newFiles = []
        files.forEach((file) => {
          if (!file.includes(fileName)) {
            newFiles.push(file)
          }
        })
        Project.findByIdAndUpdate(projectId, { files: newFiles }, { new: true })
          .then((newProject) => {
            fs.unlinkSync(completePath)
            res.status(200).send(newProject)
            /* #swagger.responses[200] = {
              description: 'Arquivo deletado com sucesso.'
            } */
          })
          .catch((error) => {
            console.error('Erro ao encontrar o projeto.', error)
            res.status(400).send({
              message: 'Erro ao encontrar o projeto, tente novamente.',
            })
            /* #swagger.responses[400] = {
              description: 'Erro ao encontrar o projeto.'
            } */
          })
      })
      .catch((error) => {
        console.error('Erro ao encontrar o projeto.', error)
        res
          .status(400)
          .send({ message: 'Erro ao encontrar o projeto, tente novamente.' })
        /* #swagger.responses[400] = {
          description: 'Erro ao encontrar projeto.'
        } */
      })
  }
)

router.delete('/project/:projectId', [AuthMid, AuthAdmin], (req, res) => {
  //#swagger.tags = ['Project']
  //#swagger.description = 'Endpoint para excluir um projeto'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const projectId = req.params.projectId
  Project.findById(projectId)
    .then((project) => {
      const absolutePath = 'upload/projects'
      const folderName = project.name
      const completePath = path.join(absolutePath, folderName)
      const featuredImagePath = path.join(completePath, 'featuredImage')
      const filesPath = path.join(completePath, 'files')

      Task.deleteMany({ _id: { $in: project.tasks } })
        .then(() => {
          Project.findByIdAndRemove(projectId)
            .then(async () => {
              await Promise.all([
                fs.promises.rm(filesPath, { recursive: true }),
                fs.promises.rm(featuredImagePath, { recursive: true }),
                fs.promises.rm(completePath, { recursive: true }),
              ])
            })
            .then(() => {
              res
                .status(200)
                .send({ message: 'Projeto e pastas removidos com sucesso!' })
              /* #swagger.responses[200] = {
                description: 'Projeto deletado com sucesso.'
              } */
            })
            .catch((error) => {
              console.error('Erro ao remover produto.', error)
              res
                .status(400)
                .send({ message: 'Erro ao remover produto, tente novamente.' })
              /* #swagger.responses[400] = {
                description: 'Erro ao encontrar projeto.'
              } */
            })
        })
        .catch((error) => {
          console.error(error)
          res
            .status(400)
            .send({ message: 'Erro ao remover projeto, tente novamente.' })
          /* #swagger.responses[400] = {
            description: 'Erro remover projeto.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao encontrar projeto.', error)
      res.status(404).send({
        message:
          'Erro ao encontrar projeto, verifique seus dados e tente novamente.',
      })
      /* #swagger.responses[404] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

export default router
