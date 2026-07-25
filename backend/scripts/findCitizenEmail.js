const User = require('../models/User');
async function find() {
  const user = await User.findById(12);
  console.log('User 12 details:', user);
  process.exit(0);
}
find();
