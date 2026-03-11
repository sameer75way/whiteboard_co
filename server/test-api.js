const axios = require('axios');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb+srv://sameer75way_db_user:NBcEgeJx9KZysfpi@cluster0.uaqgsym.mongodb.net/whiteboard');
  const user = await mongoose.connection.db.collection('users').findOne({});
  const board = await mongoose.connection.db.collection('boards').findOne({});
  const token = require('./app/common/utils/jwt.utils').generateTokens(user._id.toString(), 'User').accessToken;
  const res = await axios.get(`http://localhost:5000/api/elements/boards/${board._id.toString()}/elements`, { headers: { Authorization: `Bearer ${token}` } });
  console.log("Elements fetched:", res.data.data.length);
  if (res.data.data.length > 0) {
    console.log("First element ID:", res.data.data[0]._id, "Type:", typeof res.data.data[0]._id);
  }
}
test().catch(console.error).finally(() => process.exit(0));
