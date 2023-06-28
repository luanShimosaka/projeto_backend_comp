import mongoose from 'mongoose';

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/task-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export default mongoose;
