import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import Task from '@/app/schemas/task'
import Project from '@/app/schemas/project'
import AuthMid from '@/app/middlewares/auth'
import AuthMod from '@/app/middlewares/moderator'
import Multer from '@/app/middlewares/multerTask'
import MulterFiles from '@/app/middlewares/multerTaskFiles'

const router = new Router()

router.get('/task/:projectId', AuthMid, (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para retornar todas as tarefas de um projeto.'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto.' }
  //#swagger.security = [{ "bearer_token": [] }]

  Task.find()
    .then((data) => {
      const tasks = data.map((task) => {
        task.files = undefined
        return task
      })
      res.status(200).send(tasks)
      /* #swagger.responses[200] = {
        description: 'Tarefa criada com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao obter a tarefa no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível obter os dados da sua tarefa, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao criar a tarefa.'
      } */
    })
})

router.get('/task/:taskId', AuthMid, (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para retornar uma tarefa.'
  //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
  //#swagger.security = [{ "bearer_token": [] }]

  Task.findById(req.params.taskId)
    .then((task) => {
      res.status(200).send(task)
      /* #swagger.responses[200] = {
        description: 'Tarefas encontradas com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao obter tarefa no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível obter sua tarefa, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao obter tarefa.'
      } */
    })
})

router.post('/task/:projectId', [AuthMid, AuthMod], (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para criar uma tarefa'
  //#swagger.parameters['projectId'] = { description: 'ID do projeto que a tarefa pertence.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const { name, description, category, deadline } = req.body
  const projectId = req.params.projectId

  Project.findById(projectId)
    .then((project) => {
      Task.create({ name, description, category, deadline, project })
        .then((newTask) => {
          Project.findByIdAndUpdate(projectId, { $push: { tasks: newTask } })
            .then((project) => {
              const projectName = project.name
              const absolutePath = 'upload/projects'
              const completePath = path.join(absolutePath, projectName)
              Promise.resolve(newTask).then((newTask) => {
                const taskPath = path.join(completePath, 'tasks', newTask.name)
                const taskFoldersToCreate = [
                  taskPath,
                  path.join(taskPath, 'featuredImage'),
                  path.join(taskPath, 'files'),
                ]

                Promise.all(
                  taskFoldersToCreate.map((taskFolder) =>
                    fs.promises.mkdir(taskFolder)
                  )
                )
                  .then(() => {
                    res.status(200).send(newTask)
                    /* #swagger.responses[200] = {
                      description: 'Tarefa criada com sucesso.'
                    } */
                  })
                  .catch((error) => {
                    console.error('Erro ao criar as pastas da tarefa.', error)
                    res.status(400).send({
                      error: 'Não foi possível criar as pastas da tarefa.',
                    })
                    /* #swagger.responses[400] = {
                      description: 'Erro ao criar tarefa.'
                    } */
                  })
              })
            })
            .catch((error) => {
              console.error(
                'Erro ao encontrar projeto no banco de dados.',
                error
              )
              res.status(404).send({
                error:
                  'Não foi possível encontrar seu projeto, verifique os dados e tente novamente.',
              })
              /* #swagger.responses[404] = {
                description: 'Erro ao atualizar tarefa.'
              } */
            })
        })
        .catch((error) => {
          console.error('Erro ao salvar a tarefa no banco de dados.', error)
          res.status(400).send({
            error:
              'Não foi possível salvar a tarefa, verifique os dados e tente novamente.',
          })
          /* #swagger.responses[400] = {
            description: 'Erro ao criar tarefa.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao buscar o projeto no banco de dados.', error)
      res.status(404).send({
        error:
          'Não foi possível encontrar o projeto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[404] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

router.post(
  '/task/featured-image/:taskId',
  [AuthMid, AuthMod, Multer.single('featuredImage')],
  (req, res) => {
    //#swagger.tags = ['Task']
    //#swagger.description = 'Endpoint para cadastrar uma imagem de destaque da tarefa'
    //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const { file } = req
    if (file) {
      Task.findById(req.params.taskId).then((task) => {
        if (task.featuredImage) {
          fs.unlink(task.featuredImage, (error) => {
            if (error) {
              console.error('Erro ao excluir o arquivo existente', error)
            }
          })
        }
      })
      Task.findByIdAndUpdate(
        req.params.taskId,
        {
          $set: {
            featuredImage: file.path,
          },
        },
        { new: true }
      )
        .then((task) => {
          return res.status(200).send({ task })
          /* #swagger.responses[200] = {
            description: 'Imagem enviada com sucesso.'
          } */
        })
        .catch((error) => {
          console.error('Erro ao associar imagem a tarefa', error)
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
  '/task/files/:taskId',
  [AuthMid, MulterFiles.array('files')],
  (req, res) => {
    //#swagger.tags = ['Task']
    //#swagger.description = 'Endpoint para cadastrar arquivos da tarefa.'
    //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const { files } = req

    Task.findById(req.params.taskId)
      .then((task) => {
        let filesArray = []
        if (files && files.length > 0) {
          files.forEach((file) => {
            if (!task.files.includes(file.path)) {
              filesArray.push(file.path)
            }
          })
        }
        Task.findByIdAndUpdate(
          req.params.taskId,
          {
            $push: {
              files: {
                $each: filesArray,
              },
            },
          },
          { new: true }
        )
          .then((task) => {
            return res.status(200).send({ task })
            /* #swagger.responses[200] = {
              description: 'Arquivo enviado com sucesso.'
            } */
          })
          .catch((error) => {
            console.error('Erro ao associar arquivo a tarefa', error)
            res.status(500).send({ error: 'Erro ao enviar arquivo' })
            /* #swagger.responses[500] = {
              description: 'Erro ao enviar arquivo.'
            } */
          })
      })
      .catch((error) => {
        console.error('Erro ao encontrar a tarefa', error)
        res.status(404).send({ error: 'Tarefa não encontrada' })
        /* #swagger.responses[404] = {
          description: 'Erro ao encontrar tarefa.'
        } */
      })
  }
)

router.put('/task/:taskId', [AuthMid, AuthMod], (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para atualizar uma tarefa.'
  //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const { name, description, category, deadline } = req.body
  Task.findByIdAndUpdate(
    req.params.taskId,
    { name, description, category, deadline },
    { new: true }
  )
    .then((task) => {
      if (task == null) {
        return res.status(404).send({
          error: 'Tarefa inexistente.',
        })
        /* #swagger.responses[404] = {
          description: 'Erro ao encontrar tarefa.'
        } */
      }
      res.status(200).send(task)
      /* #swagger.responses[200] = {
        description: 'Tarefa atualizada com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao atualizar o produto no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível atualizar seu produto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao atualizar tarefa.'
      } */
    })
})

router.put('/task/complete/:taskId', [AuthMid, AuthMod], (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para concluir uma tarefa.'
  //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const status = req.body
  const completedAt = Date.now()
  Task.findByIdAndUpdate(
    req.params.taskId,
    { status, completedAt },
    { new: true }
  )
    .then((task) => {
      res.status(200).send(task)
      /* #swagger.responses[200] = {
        description: 'Tarefa concluída com sucesso.'
      } */
    })
    .catch((error) => {
      console.error('Erro ao atualizar o produto no banco de dados.', error)
      res.status(400).send({
        error:
          'Não foi possível atualizar seu produto, verifique os dados e tente novamente.',
      })
      /* #swagger.responses[400] = {
        description: 'Erro ao concluir tarefa.'
      } */
    })
})

router.delete(
  '/task/featured-image/:taskId',
  [AuthMid, AuthMod],
  (req, res) => {
    //#swagger.tags = ['Task']
    //#swagger.description = 'Endpoint para excluir a imagem de destaque da tarefa'
    //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const taskId = req.params.taskId

    Task.findById(taskId)
      .then((task) => {
        const fileName = task.featuredImage
        fs.unlinkSync(fileName)
        task.featuredImage = undefined
        task.save()
        res.status(200).send(task)
        /* #swagger.responses[200] = {
          description: 'Imagem removida com sucesso.'
        } */
      })
      .catch((error) => {
        console.error('Erro ao encontrar a tarefa.', error)
        res
          .status(400)
          .send({ message: 'Erro ao encontrar a tarefa, tente novamente.' })
        /* #swagger.responses[400] = {
          description: 'Erro ao remover imagem.'
        } */
      })
  }
)

router.delete('/task/:taskId/:fileName', [AuthMid, AuthMod], (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para excluir o arquivo de uma tarefa.'
  //#swagger.parameters['taskId'] = { description: 'ID da tarefa.' }
  //#swagger.parameters['fileName'] = { description: 'Nome do arquivo.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const taskId = req.params.taskId
  const fileName = req.params.fileName

  Task.findById(taskId)
    .then((task) => {
      const projectId = task.project
      Project.findById(projectId)
        .then((project) => {
          const completePath = path.join(
            'upload/projects/' +
              project.name +
              '/tasks/' +
              task.name +
              '/files/' +
              fileName
          )
          const files = task.files
          let newFiles = []
          files.forEach((file) => {
            if (!file.includes(fileName)) {
              newFiles.push(file)
            }
          })
          Task.findByIdAndUpdate(taskId, { files: newFiles }, { new: true })
            .then((newTask) => {
              fs.unlinkSync(completePath)
              res.status(200).send(newTask)
              /* #swagger.responses[200] = {
                description: 'Tarefa removida com sucesso.'
              } */
            })
            .catch((error) => {
              console.error('Erro ao remover arquivo.', error)
              res.status(400).send({
                message: 'Erro ao remover arquivo, tente novamente.',
              })
              /* #swagger.responses[400] = {
                description: 'Erro ao remover tarefa.'
              } */
            })
        })
        .catch((error) => {
          console.error('Erro ao encontrar projeto.', error)
          res
            .status(404)
            .send({ message: 'Erro ao encontrar projeto, tente novamente.' })
          /* #swagger.responses[404] = {
            description: 'Erro ao encontrar projeto.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao encontrar a tarefa.', error)
      res
        .status(404)
        .send({ message: 'Erro ao encontrar a tarefa, tente novamente.' })
      /* #swagger.responses[404] = {
        description: 'Erro ao encontrar projeto.'
      } */
    })
})

router.delete('/task/:taskId', [AuthMid, AuthMod], (req, res) => {
  //#swagger.tags = ['Task']
  //#swagger.description = 'Endpoint para excluir uma tarefa.'
  //#swagger.parameters['taskId'] = { description: 'ID da terfa.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const taskId = req.params.taskId

  Task.findByIdAndRemove(taskId)
    .populate('project')
    .then((task) => {
      const taskName = task.name
      const projectName = task.project.name
      const filesPath = `upload/projects/${projectName}/tasks/${taskName}`
      const projectId = task.project._id
      Project.findByIdAndUpdate(projectId, { $pull: { tasks: taskId } })
        .then(() => {
          return fs.promises.rm(filesPath, { recursive: true })
        })
        .then(() => {
          res.status(200).send({ message: 'Tarefa removida com sucesso.' })
          /* #swagger.responses[200] = {
            description: 'Tarefa removida com sucesso.'
          } */
        })
        .catch((error) => {
          console.error('Erro ao remover tarefa do projeto.', error)
          res.status(400).send({
            message:
              'Erro ao remover tarefa do projeto, verifique os dados e tente novamente.',
          })
          /* #swagger.responses[400] = {
            description: 'Erro ao remover tarefa do projeto, verifique os dados e tente novamente.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao remover tarefa.', error)
      res
        .status(400)
        .send({ message: 'Erro ao remover tarefa, tente novamente.' })
      /* #swagger.responses[400] = {
        description: 'Erro ao remover tarefa.'
      } */
    })
})

export default router
