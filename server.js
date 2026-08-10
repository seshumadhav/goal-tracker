const express = require('express');

const app = express();
const PORT = process.env.PORT || 3002;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GOAT listening on port ${PORT}`);
  });
}

module.exports = app;
