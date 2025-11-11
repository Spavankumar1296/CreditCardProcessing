const express = require("express");
const UserRouter = require("./user");
const { AccountRouter } = require("./account");

const MainRouter = express.Router();
MainRouter.use('/user', UserRouter);
MainRouter.use('/Account',AccountRouter)

module.exports = MainRouter;
   