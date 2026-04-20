const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/task',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.data) {
        console.log(`✅ API fonctionne! ${parsed.data.length} tâches trouvées`);
        console.log('📋 Première tâche:', parsed.data[0]);
      } else {
        console.log('❌ API retourne une erreur:', parsed);
      }
    } catch (e) {
      console.log('❌ Réponse JSON invalide:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erreur de requête: ${e.message}`);
});

req.on('timeout', () => {
  console.error('❌ Timeout de la requête');
  req.destroy();
});

req.end();
