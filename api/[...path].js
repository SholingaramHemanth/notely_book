const { app, connectDatabase } = require('../server');

module.exports = async (req, res) => {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('[notely] MongoDB error:', error.message);
  }
  return app(req, res);
};
