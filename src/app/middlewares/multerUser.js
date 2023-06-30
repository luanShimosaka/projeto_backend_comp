import multer from 'multer'
import Slugify from '@/utils/Slugify'
import path from 'path'
import User from '@/app/schemas/user'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.userId
    User.findById(userId).then((user) => {
      const absolutePath = 'upload/users'
      const userName = user.name
      const completePath = path.join(absolutePath, userName)
      cb(null, completePath)
    })
  },
  filename: (req, file, cb) => {
    const [filename, extension] = file.originalname.split('.')
    cb(null, `${Slugify(filename)}.${extension}`)
  },
})

export default multer({ storage })
