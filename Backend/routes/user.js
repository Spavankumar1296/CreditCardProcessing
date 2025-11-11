const express = require("express");
const { SignupValidation, SigninValidation, UpdateValidation } = require("../validation");
const { UserModel, Account } = require("../db");
const jwt = require("jsonwebtoken")
const {JWT_SECRET} = require("../config");
const { authMiddleware } = require("../authetication");
const { nan } = require("zod");

const UserRouter = express.Router();

UserRouter.post('/Signup', async(req, res) => {
    const CreatePayload = req.body;
    console.log(CreatePayload)
    const ParsedPayload = SignupValidation.safeParse(CreatePayload);
    console.log(ParsedPayload)
    if (ParsedPayload.success) {
        const righttogo = await UserModel.findOne({
            Email:req.body.Email
        })
        if(!righttogo) {
            const user = new UserModel(ParsedPayload.data)
            user.save().then(async()=>{
                console.log("user succesfully saved")
                const userid = await UserModel.findOne({Email:req.body.Email})
                const token = jwt.sign({userId:userid._id},JWT_SECRET)
                const UserAccount = new Account({
                    userId:userid._id,
                    Balance:1+Math.floor(Math.random()*10000) 
                })
                UserAccount.save().then(()=>{
                    res.json({
                        msg:"Welcome " + ParsedPayload.data.FirstName,
                        token:token
                    })
                })
            }).catch((err)=>{
                console.log("Due to network crises User didn't saved try again!",err)
            })
        }
        else {
            res.json({
                msg:"Sorry given Email already Exist"
            })
        }
    } else {
        res.json({
            msg: "Email Already Taken/Incorrect inputs"
        });
    }
});

UserRouter.post('/Signin',async(req,res)=>{
    const { success } = SigninValidation.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const user = await UserModel.findOne({
        Email:req.body.Email,
        Password: req.body.Password
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);
        res.json({
            msg:"welcome back "+ user.FirstName + user.LastName,
            username:user.FirstName,
            token: token
        })
        return;
    }

    res.json({
        msg: "Account Not Found/Wrong Password"
    })
})

UserRouter.put('/Update',authMiddleware,async(req,res)=>{
    const CreatePayload = req.body
    const paresepayload = UpdateValidation.safeParse(CreatePayload)
    if(!paresepayload.success) {
        return res.json({
            msg:"Incorrect inputs"
        })
    }
    const firstname = req.body.FirstName
    const lastname = req.body.LastName
    const password = req.body.Password
    await UserModel.updateOne({_id:req.userId},{
        FirstName:firstname,
        LastName:lastname,
        Password:password
    })

    res.json({
        msg:"updated successfully"
    })
})


UserRouter.post('/bulk', async (req, res) => {
  try {
    // 1) get token from Authorization header (supports "Bearer <token>" or raw token)
    const authHeader = req.body.auth || req.headers.authorization || "";
    console.log("this is the auth header : " , authHeader)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    // 2) verify token and extract email (adjust field names according to your token payload)
    let decoded;
    try {
      decoded = jwt.verify(token,JWT_SECRET);
    } catch (verifyErr) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    console.log("decoded: ", decoded)

    const userid = decoded.userId;
    // fallback: if your token uses a different field name, adjust the line above.

    // 4) build query: exclude current user's email and optionally search names (case-insensitive)
    const query = {
        _id: { $ne: userid }, // exclude logged-in user
      };

    // if (str && typeof str === "string" && str.trim().length > 0) {
    //   const re = new RegExp(str.trim(), "i"); // case-insensitive
    //   query.$or = [{ FirstName: re }, { LastName: re }];
    // }

    // 5) fetch matching users (select only required fields)
    const data = await UserModel.find(query).select("FirstName LastName _id").limit(200);

    // 6) map to required response shape
    const finaldata = data.map((val) => ({
      Username: `${val.FirstName} ${val.LastName}`,
      id: val._id,
    }));

    return res.json(finaldata);
  } catch (err) {
    console.error("Error in /bulk:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// GET /api/v1/user/me
// returns the current user's profile (no password) and account balance if available
UserRouter.get("/me", authMiddleware, async (req, res) => {
    try {
      // require models at top of file: const { UserModel, Account } = require("../db");
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ msg: "Unauthorized" });
      }
  
      // fetch user without sensitive fields
      const user = await UserModel.findById(userId)
        .select("-Password -__v")
        .lean();
  
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
  
      // optionally fetch account balance to include in the response
      let balance;
      try {
        const acc = await Account.findOne({ userId }).lean();
        if (acc && typeof acc.Balance !== "undefined") balance = acc.Balance;
      } catch (e) {
        // ignore account lookup errors — it's non-critical
        console.warn("Could not fetch account for user:", e);
      }
  
      // return profile + optional balance
      return res.json({
        ...user,
        balance,
      });
    } catch (err) {
      console.error("Error in /me:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  });
  

  

module.exports = UserRouter;
