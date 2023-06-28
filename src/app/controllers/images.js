import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = new Router()

router.get('/images/:path/:filename', (req, res) => {
  //#swagger.tags = ['Images']
  //#swagger.description = 'Endpoint para retornar uma imagem'

  const filePath = path.resolve(
    `./upload/${req.params.path}/${req.params.filename}`
  )
  fs.exists(filePath, (exists) => {
    if (exists) {
      return res.sendFile(filePath)
    } else {
      return res.status(404).send({ error: 'File not found' })
      /* #swagger.responses[404] = {
        description: 'Erro ao encontrar imagem.'
      } */
    }
  })
})

export default router
