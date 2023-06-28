import mongoose from '@/database';
import Task from './task';
import User from './user';
import Slugify from '@/utils/Slugify';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    client: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        default: undefined,
    },
    featuredImage: {
        type: String,
        default: undefined,
    },
    tasks: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: Task,
    }],
    squad: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
    }],
    files: [{ type: String }],
    createdAt:  {
        type: Date,
        default: Date.now,
    },
    complete: {
        type: Boolean,
        default: false,
    },
    completedAt:  {
        type: Date,
        default: undefined,
    },
});


projectSchema.pre('save', function(next) {
    const name = this.name;
    this.slug = Slugify(name);
    next();
});


export default mongoose.model('project', projectSchema);