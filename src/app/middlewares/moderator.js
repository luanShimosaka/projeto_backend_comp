export default (req, res, next) => { 
  if(req.user.isAdmin || req.user.isMod) {
    next();
  } else {
    res.status(403).send({ error: 'Access denied' });
  }  
}
  