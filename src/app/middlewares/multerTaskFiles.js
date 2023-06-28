import multer from 'multer';
import Slugify from '@/utils/Slugify';
import path from 'path';
import Project from '@/app/schemas/project';
import Task from '@/app/schemas/task';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const taskId = req.params.taskId;
        Task.findById(taskId)
            .populate('project')
            .then(task => {
                const absolutePath = 'upload/projects';
                const projectName = task.project.name;
                const taskName = task.name;
                const completePath = path.join(absolutePath, projectName, 'tasks', taskName, 'files');
                cb(null, completePath);
            })
    },
    filename: (req, file, cb) => {
        const [filename, extension] = file.originalname.split('.');
        cb(null, `${Slugify(filename)}.${extension}`);
    },
});


export default multer({ storage });