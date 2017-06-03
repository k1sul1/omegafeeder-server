const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const socketioJWT = require('socketio-jwt');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const PORT = process.env.PORT || 7890;
const SECRET = process.env.SECRET || 'OMEGAFEEDER_SECRET';
const USERNAME = process.env.USERNAME || 'USERNAME';
const PASSWORD = process.env.PASSWORD || 'PASSWORD';

const getToken = (user, pass) => {
  if (!(user === USERNAME && pass === PASSWORD)) {
    return false;
  }

  const profile = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@doe.com',
    id: 123
  };

  return jwt.sign(profile, SECRET, { expiresIn: "1 day" });
};

io.on('connection', socketioJWT.authorize({
  secret: SECRET,
  timeout: 15000
})).on('authenticated', function(socket) {
  console.log(socket);
});

nextApp.prepare().then(() => {
  app.get('/authenticate', (req, res) => {
    const token = getToken(req.query.username, req.query.password);

    if (token) {
      res.json({ token: token });
      return;
    }

    res.status(401).json({ error: 'Wrong username or password' });
  });

  app.use('/admin', expressJwt({ secret: PASSWORD }));
  app.get('/admin', (req, res) => {
    const actualPage = '/admin';
    const queryParams = { id: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });

  app.get('/p/:id', (req, res) => {
    const actualPage = '/post';
    const queryParams = { id: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });

  app.get('*', (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
