import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import authConfig from '@/config/auth'
import mailer from '@/modules/mailer'
import User from '@/app/schemas/user'
import Project from '@/app/schemas/project'
import AuthMid from '@/app/middlewares/auth'
import AuthAdmin from '@/app/middlewares/admin'
import Multer from '@/app/middlewares/multerTask'

const router = new Router()

const generateToken = (params) => {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 1000000,
  })
}

router.post('/user/register', (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para cadastrar um usuário'

  const { email, name, password } = req.body
  const absolutePath = 'upload/users'
  const folderName = name
  const completePath = path.join(absolutePath, folderName)

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'User already exists' })
        /* #swagger.responses[400] = {
          description: 'Erro ao criar usuário.'
        } */
      } else {
        User.create({ name, email, password })
          .then((user) => {
            user.password = undefined
            fs.promises
              .mkdir(completePath)
              .then(() => {
                res.status(200).send({ user })
                /* #swagger.responses[200] = {
                  description: 'Usuário criado com sucesso.'
                } */
              })
              .catch((error) => {
                console.error('Erro ao criar pasta do usuário', error)
                return res.status(500).send({ error: 'Registration failed' })
                /* #swagger.responses[500] = {
                  description: 'Erro ao registrar usuário.'
                } */
              })
          })
          .catch((error) => {
            console.error('Erro ao salvar usuário', error)
            return res.status(400).send({ error: 'Registration failed' })
            /* #swagger.responses[400] = {
              description: 'Erro ao registrar usuário.'
            } */
          })
      }
    })
    .catch((error) => {
      console.error('Erro ao consultar usuário no banco de dados', error)
      return res.status(500).send({ error: 'Registration failed' })
      /* #swagger.responses[500] = {
        description: 'Erro ao consutar banco de dados.'
      } */
    })
})

router.post('/user/login', (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para logar um usuário'

  const { email, password } = req.body

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = generateToken({
                uid: user.id,
                isAdmin: user.isAdmin,
                isMod: user.isMod,
              })
              return res.send({ token: token, tokenExpiration: '1d' })
            } else {
              return res.status(400).send({ error: 'Invalid password' })
              /* #swagger.responses[400] = {
                description: 'Senha inválida.'
              } */
            }
          })
          .catch((error) => {
            console.error('Erro ao verificar senha', error)
            return res.status(500).send({ error: 'Internal server error' })
            /* #swagger.responses[500] = {
              description: 'Erro ao verificar senha.'
            } */
          })
      } else {
        return res.status(404).send({ error: 'User not found' })
        /* #swagger.responses[404] = {
          description: 'Usuário não encontrado.'
        } */
      }
    })
    .catch((error) => {
      console.error('Erro ao logar', error)
      return res.status(500).send({ error: 'Internal server error' })
      /* #swagger.responses[500] = {
        description: 'Erro ao logar.'
      } */
    })
})

router.post('/user/forgot-password', (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para recuperar a senha de um usuário'

  const { email } = req.body

  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex')
        const expiration = new Date()
        expiration.setHours(new Date().getHours() + 1)

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            mailer.sendMail(
              {
                to: email,
                from: 'admin@compjunior.br',
                template: 'auth/forgot_password',
                context: { token },
              },
              (error) => {
                if (error) {
                  console.error('Erro ao enviar email', error)
                  return res
                    .status(400)
                    .send({ error: 'Fail sending recover password mail' })
                  /* #swagger.responses[400] = {
                      description: 'Erro ao enviar email de recuperação de senha.'
                    } */
                } else {
                  return res.send()
                }
              }
            )
          })
          .catch((error) => {
            console.error(
              'Erro ao salvar o token de recuperação de senha',
              error
            )
            return res.status(500).send({ error: 'Internal server error' })
            /* #swagger.responses[500] = {
              description: 'Erro ao salvar token de recuperação de senha.'
            } */
          })
      } else {
        return res.status(404).send({ error: 'User not found' })
        /* #swagger.responses[404] = {
          description: 'Erro ao encontrar usuário.'
        } */
      }
    })
    .catch((error) => {
      console.error('Error no forgot password', error)
      return res.status(500).send({ error: 'Internal server error' })
      /* #swagger.responses[500] = {
        description: 'Erro no esqueci minha senha.'
      } */
    })
})

router.post('/user/reset-password', (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para resetar a senha de um usuário'

  const { email, token, newPassword } = req.body

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then((user) => {
      if (user) {
        if (
          token != user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Invalid token' })
        } else {
          user.passwordResetToken = undefined
          user.passwordResetTokenExpiration = undefined
          user.password = newPassword

          user
            .save()
            .then(() => {
              res.status(200).send({ message: 'Senha trocada com sucesso' })
              /* #swagger.responses[200] = {
                description: 'Senha alterada com sucesso.'
              } */
            })
            .catch((error) => {
              console.error('Erro ao salvar nova senha do usuário', error)
              return res.status(500).send({ error: 'Internal server error' })
              /* #swagger.responses[500] = {
                description: 'Erro ao salvar nova senha do usuário.'
              } */
            })
        }
      } else {
        return res.status(404).send({ error: 'User not found' })
        /* #swagger.responses[404] = {
          description: 'Usuário não encontrado.'
        } */
      }
    })
    .catch((error) => {
      console.error('Erro no reset password', error)
      return res.status(500).send({ error: 'Internal server error' })
      /* #swagger.responses[500] = {
        description: 'Erro ao resetar senha.'
      } */
    })
})

router.post(
  '/user/userImage/:userId',
  [AuthMid, Multer.single('userImage')],
  (req, res) => {
    //#swagger.tags = ['User']
    //#swagger.description = 'Endpoint para adicionar uma imagem a um usuário'
    //#swagger.parameters['userId'] = { description: 'ID do usuário.' }
    //#swagger.security = [{ "bearer_token": [] }]

    const { file } = req
    if (file) {
      User.findByIdAndUpdate(
        req.params.userId,
        {
          $set: {
            image: file.path,
          },
        },
        { new: true }
      )
        .then((user) => {
          return res.status(200).send({ user })
          /* #swagger.responses[200] = {
            description: 'Imagem registrada com sucesso.'
          } */
        })
        .catch((error) => {
          console.error('Erro ao associar imagem ao usuário', error)
          res.status(500).send({ error: 'Erro ao enviar imagem' })
          /* #swagger.responses[500] = {
            description: 'Erro ao registrar imagem do usuário.'
          } */
        })
    } else {
      return res.status(400).send({ error: 'Não foi possível enviar a imagem' })
      /* #swagger.responses[400] = {
        description: 'Erro ao registrar imagem do usuário.'
      } */
    }
  }
)

router.put('/user/turn-moderator', [AuthMid, AuthAdmin], (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para tornar um usuário moderador'
  //#swagger.security = [{ "bearer_token": [] }]

  const { email } = req.body

  User.findOne({ email })
    .then((user) => {
      if (user) {
        User.findByIdAndUpdate(user.id, {
          $set: {
            isMod: true,
          },
        })
          .then(() => {
            res
              .status(200)
              .send({ message: 'Usuário moderador alterado com sucesso' })
            /* #swagger.responses[200] = {
              description: 'Usuário moderador alterado com sucesso.'
            } */
          })
          .catch((error) => {
            console.error('Erro ao alterar usuário', error)
            return res.status(500).send({ error: 'Internal server error' })
            /* #swagger.responses[500] = {
              description: 'Erro ao tornar usuário moderador.'
            } */
          })
      } else {
        return res.status(404).send({ error: 'User not found' })
        /* #swagger.responses[404] = {
          description: 'Usuário não encontrado.'
        } */
      }
    })
    .catch((error) => {
      console.error('Erro no turn admin', error)
      return res.status(500).send({ error: 'Internal server error' })
      /* #swagger.responses[500] = {
        description: 'Erro ao tornar usuário moderador.'
      } */
    })
})

router.delete('/user/delete/:userId', [AuthMid, AuthAdmin], (req, res) => {
  //#swagger.tags = ['User']
  //#swagger.description = 'Endpoint para deletar um usuário'
  //#swagger.parameters['userId'] = { description: 'ID do usuário.' }
  //#swagger.security = [{ "bearer_token": [] }]

  const userId = req.params.userId

  User.findByIdAndRemove(userId)
    .then((user) => {
      const userName = user.name
      const filesPath = `upload/users/${userName}`
      Project.updateMany({ squad: userId }, { $pull: { squad: userId } })
        .then(() => {
          return fs.promises.rm(filesPath, { recursive: true })
        })
        .then(() => {
          res.status(200).send({ message: 'Usuário removido com sucesso' })
          /* #swagger.responses[200] = {
            description: 'Usuário removido com sucesso.'
          } */
        })
        .catch((error) => {
          console.error('Erro ao remover usuário do projeto.', error)
          res
            .status(400)
            .send({ message: 'Erro ao remover usuário, tente novamente.' })
          /* #swagger.responses[400] = {
            description: 'Erro ao remover usuário.'
          } */
        })
    })
    .catch((error) => {
      console.error('Erro ao remover usuário.', error)
      res
        .status(400)
        .send({ message: 'Erro ao remover usuário, tente novamente.' })
      /* #swagger.responses[400] = {
        description: 'Erro ao remover usuário.'
      } */
    })
})

export default router
