const express = require("express");
const app = express();
const cors = require("cors");
const MainRouter = require("./routes/index");

app.use(express.json());
app.use(cors());
app.use('/api/v1', MainRouter);  


app.listen(3000, () => {
    console.log("Listening on port 3000");
});
