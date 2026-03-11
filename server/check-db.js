const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sameer75way_db_user:NBcEgeJx9KZysfpi@cluster0.uaqgsym.mongodb.net/whiteboard')
  .then(async () => {
    console.log("Connected to DB");
    const elements = await mongoose.connection.db.collection('elements').find().sort({createdAt: -1}).limit(5).toArray();
    console.log("Element count in 'elements':", await mongoose.connection.db.collection('elements').countDocuments());
    if (elements.length > 0) {
      console.log("Latest element:", JSON.stringify(elements[0], null, 2));
    }
    const boards = await mongoose.connection.db.collection('boards').find().sort({createdAt: -1}).limit(1).toArray();
    if (boards.length > 0) {
      console.log("Latest board ID:", boards[0]._id);
      const elementsForBoard = await mongoose.connection.db.collection('elements').find({boardId: boards[0]._id}).toArray();
      console.log(`Elements for board ${boards[0]._id}:`, elementsForBoard.length);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
