import mongoose from '@/database';
import Slugify from '@/utils/Slugify';
import projectSchema from './project';

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        default: undefined,
    },
    status: {
        type: String,
        default: "Não iniciado",
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: projectSchema,
        required: true,
    },
    featuredImage: {
        type: String,
        default: undefined,
    },
    files: [{ type: String }],
    createdAt:  {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
        default: undefined,
    }
});

taskSchema.pre('save', function(next) {
    const name = this.name;
    this.slug = Slugify(name);
    next();
});

export default mongoose.model('task', taskSchema);