const express = require("express")
const { Account, UserModel, Transaction } = require("../db")
const { authMiddleware } = require("../authetication")
const { default: mongoose } = require("mongoose")
const AccountRouter = express.Router()

AccountRouter.get('/balance',authMiddleware,async(req,res)=>{
    const id = req.userId
    const balance = await Account.findOne({userId:id})
    const username = await UserModel.findById(req.userId)
    res.json({
        balance:balance.Balance,
        username:username.FirstName,
        userid:username._id
    })  
})

// POST /transaction
AccountRouter.post("/transaction", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const transactionTo = req.body.to;
    const amount = Number(req.body.amount);
    const note = req.body.note ?? "";

    if (!transactionTo || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Invalid recipient or amount" });
    }

    // load sender account
    const fromAcc = await Account.findOne({ userId: req.userId }).session(session);
    if (!fromAcc || fromAcc.Balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Insufficient Amount" });
    }

    // load recipient account
    const toAcc = await Account.findOne({ userId: transactionTo }).session(session);
    if (!toAcc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "You are trying to send money to an invalid user" });
    }

    // update balances atomically
    await Account.findOneAndUpdate(
      { userId: req.userId },
      { $inc: { Balance: -amount } },
      { session }
    );

    await Account.findOneAndUpdate(
      { userId: transactionTo },
      { $inc: { Balance: amount } },
      { session }
    );

    // Optionally fetch sender/receiver names to store a snapshot in the transaction
    // (not strictly required but helpful for reads)
    const [senderUser, receiverUser] = await Promise.all([
      UserModel.findById(req.userId).select("FirstName LastName Email").session(session).lean(),
      UserModel.findById(transactionTo).select("FirstName LastName Email").session(session).lean(),
    ]);

    const senderName = senderUser
      ? ((senderUser.FirstName || "") + " " + (senderUser.LastName || "")).trim() || senderUser.Email
      : undefined;
    const receiverName = receiverUser
      ? ((receiverUser.FirstName || "") + " " + (receiverUser.LastName || "")).trim() || receiverUser.Email
      : undefined;

    // create transaction record
    const tx = new Transaction({
      senderId: req.userId,
      receiverId: transactionTo,
      amount: amount,
      note,
      senderName: senderName || "",
      receiverName: receiverName || "",
    });

    await tx.save({ session });

    // commit
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      msg: "Transaction successful",
      transactionId: tx._id,
    });
  } catch (err) {
    console.error("Transaction error:", err);
    try {
      await session.abortTransaction();
    } catch (e) {
      console.error("Abort transaction failed:", e);
    }
    session.endSession();
    return res.status(500).json({ msg: "Transaction failed", error: err.message });
  }
});
AccountRouter.get("/transactions", authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      // fetch the transactions where user is sender or receiver, newest first
      const txs = await Transaction.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(500) // adjust limit as needed
        .lean();
  
      // collect unique userIds referenced in the transactions so we can fetch names once
      const userIds = new Set();
      for (const t of txs) {
        if (t.senderId) userIds.add(String(t.senderId));
        if (t.receiverId) userIds.add(String(t.receiverId));
      }
  
      // remove the current user from lookup set if you want (optional)
      // userIds.delete(String(userId));
  
      const idsArray = Array.from(userIds);
      let usersMap = {};
      if (idsArray.length > 0) {
        const users = await UserModel.find({ _id: { $in: idsArray } })
          .select("FirstName LastName Email")
          .lean();
        usersMap = users.reduce((acc, u) => {
          const name =
            (u.FirstName || u.LastName)
              ? `${u.FirstName || ""} ${u.LastName || ""}`.trim()
              : u.Email || u.username || String(u._id);
          acc[String(u._id)] = name;
          return acc;
        }, {});
      }
  
      // map transactions to a clean response shape
      const result = txs.map((t) => ({
        id: t._id ?? t.id,
        senderId: t.senderId,
        receiverId: t.receiverId,
        senderName: usersMap[String(t.senderId)] || t.senderName || null,
        receiverName: usersMap[String(t.receiverId)] || t.receiverName || null,
        amount: t.amount ?? t.Amount ?? 0,
        note: t.note ?? t.Note ?? "",
        createdAt: t.createdAt ?? t.createdAt ?? t.createdAt,
        raw: t,
      }));
  
      return res.json(result);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });


module.exports = {
    AccountRouter
}