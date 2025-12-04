const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI)

const SignupUserSchema = new mongoose.Schema({
  FirstName: {
    type: String,
    required: true,
  },
  LastName: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    unique: true,
    required: true,
  },
  Password: {
    type: String,
    required: true,
    trim: true,
  }
})

const BankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model roiii
    ref: 'Users',
    unique: true,
    required: true
  },
  Balance: {
    type: Number,
    required: true
  }
})

// models/Transaction.js (or wherever you keep models)


const TransactionSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {               // normalized field name (was RecevierId)
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  // optional helpful fields: store snapshot of names so UI doesn't need to join users
  senderName: {
    type: String,
    default: "",
  },
  receiverName: {
    type: String,
    default: "",
  },
  // other metadata (optional)
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true, // <-- creates createdAt and updatedAt automatically
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
const UserModel = mongoose.model('Users', SignupUserSchema)
const Account = mongoose.model('Account', BankSchema)

module.exports = {
  UserModel, Account, Transaction
}

