import net from 'net';

const client = new net.Socket();

const IMEI = '012345678901234';
// Example coordinates for Varanasi: 25.3176, 82.9739
// Format for TK103: DDMM.MMMM -> 25 degrees + (0.3176 * 60 = 19.056) -> 2519.0560
// 82 degrees + (0.9739 * 60 = 58.434) -> 8258.4340

const testPayload = `(${IMEI},BR00,260723,A,2519.0560,N,08258.4340,E,0.0,0)`;

client.connect(4005, '127.0.0.1', () => {
  console.log('Connected to GPS server');
  console.log('Sending:', testPayload);
  client.write(testPayload);
});

client.on('data', (data) => {
  console.log('Received:', data.toString());
  client.destroy();
});

client.on('close', () => {
  console.log('Connection closed');
});
