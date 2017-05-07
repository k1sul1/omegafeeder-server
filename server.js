const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const OMEGAFEEDER_CLIENT_ID = process.env.OMEGAFEEDER_CLIENT_ID
  || 'OMEGAFEEDER_DEV';
const OMEGAFEEDER_CLIENT_SECRET = process.env.OMEGAFEEDER_CLIENT_SECRET
  || 'OMEGAFEEDER_DEV_SECRET';

const isAuthenticated = (client_id, client_secret) => {
  if (
    OMEGAFEEDER_CLIENT_ID === client_id
    &&
    OMEGAFEEDER_CLIENT_SECRET === client_secret
  ) {
    return true;
  }

  return false;
}

io.on('connection', (socket) => {
  let authenticated = false;
  socket.emit('authenticate', { message: 'Authenticate yourself' });
  socket.on('authenticate', data => {
    authenticated = isAuthenticated(data.CLIENT_ID, data.CLIENT_SECRET);

    if (!authenticated) {
      socket.emit('not-authenticated', { 'message': 'not authenticated' });
      socket.disconnect(true);
    } else {
      socket.emit('authenticated', { 'message': 'authenticated' });
    }
  });
});

nextApp.prepare().then(() => {
  app.get('/p/:id', (req, res) => {
    const actualPage = '/post';
    const queryParams = { title: req.params.id };
    nextApp.render(req, res, actualPage, queryParams);
  });

  app.get('*', (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(8000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:8000');
  });
})
.catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
