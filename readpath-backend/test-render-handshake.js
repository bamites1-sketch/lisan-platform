const net = require('net');
const tls = require('tls');

const host = 'dpg-dald6hv40ujc73djsb20-a.oregon-postgres.render.com';
const port = 5432;

const socket = net.createConnection({ host, port }, () => {
  console.log('TCP connected');
  // SSLRequest packet: length 8, code 80877103
  const buf = Buffer.alloc(8);
  buf.writeInt32BE(8, 0);
  buf.writeInt32BE(80877103, 4);
  socket.write(buf);
});

socket.once('data', (data) => {
  if (data[0] === 83) { // 'S'
    console.log('Server accepted SSL. Upgrading to TLS...');
    const tlsSocket = tls.connect({
      socket: socket,
      rejectUnauthorized: false,
      servername: host
    }, () => {
      console.log('TLS established! Sending StartupMessage...');
      
      // Send StartupMessage
      // user: lisan_db_xdfu_user, database: lisan_db_xdfu
      const user = 'lisan_db_xdfu_user';
      const database = 'lisan_db_xdfu';
      const params = `user\0${user}\0database\0${database}\0\0`;
      const len = 4 + 4 + Buffer.byteLength(params);
      const startup = Buffer.alloc(len);
      startup.writeInt32BE(len, 0);
      startup.writeInt32BE(196608, 4); // Protocol version 3.0
      startup.write(params, 8);
      
      tlsSocket.write(startup);
    });

    tlsSocket.on('data', (d) => {
      console.log('Received TLS data from server (type ' + String.fromCharCode(d[0]) + '):');
      console.log(d.toString());
    });

    tlsSocket.on('error', (err) => {
      console.error('TLS error:', err);
    });

    tlsSocket.on('close', () => {
      console.log('TLS socket closed by server');
    });
  }
});
