let clients = [];

const sse = {
  addClient: (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);
    console.log(`[SSE] Client connected. Total: ${clients.length}`);

    req.on('close', () => {
      clients = clients.filter(c => c !== res);
      console.log(`[SSE] Client disconnected. Total: ${clients.length}`);
    });
  },

  broadcast: (event, data = {}) => {
    console.log(`[SSE] Broadcasting event: ${event}`);
    clients.forEach(res => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }
};

module.exports = sse;
