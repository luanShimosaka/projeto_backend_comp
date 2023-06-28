import multer from 'multer';
import Slugify from '@/utils/Slugify';
import path from 'path';
import Project from '@/app/schemas/project';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = req.params.projectId;
        Project.findById(projectId)
            .then(project => {
                const absolutePath = 'upload/projects';
                const projectName = project.name;
                const completePath = path.join(absolutePath, projectName, 'featuredImage');
                cb(null, completePath);
            });
    },
    filename: (req, file, cb) => {
        const [filename, extension] = file.originalname.split('.');
        cb(null, `${Slugify(filename)}.${extension}`);
    },
});


export default multer({ storage });