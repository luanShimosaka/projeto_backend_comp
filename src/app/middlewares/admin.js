export default (req, res, next) => { 
  if(req.user.isAdmin) {
    next();
  } else {
    res.status(403).send({ error: 'Access denied' });
  }
}
