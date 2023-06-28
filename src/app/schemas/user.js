import mongoose from '@/database';
import bcrypt from 'bcryptjs';
import Project from './project';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetTokenExpiration: {
        type: Date,
        select: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isMod: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: undefined,
    },
    createdAt: {
        type: Date,
        defalut: Date.now,
    },
});

UserSchema.pre('save', function (next) {
    bcrypt
        .hash(this.password, 10)
        .then(hash => {
            this.password = hash;
            next();
        })
        .catch(error => {
            console.error('Error hashing password', error);
        });
});

export default mongoose.model('User', UserSchema);