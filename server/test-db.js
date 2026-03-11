const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sameer:sameer@cluster0.pbgns.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log("Connected to DB");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    const elements = await mongoose.connection.db.collection('elements').find().toArray();
    console.log("Element count:", elements.length);
    if (elements.length > 0) {
      console.log("Sample element DB boardId:", elements[0].boardId);
      console.log("Sample element DB _id:", elements[0]._id);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
