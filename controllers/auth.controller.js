import bcrypt from "bcrypt"
import User from "../models/userModel.js"
import jwt  from "jsonwebtoken"

export const signUp = async (req, res) => {
    const { username, password, image } =  req.body
    // Hash the password with a salt of 10 rounds
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const usernameTaken = await User.findOne({ username })
    if (usernameTaken) {
        // If the username is already taken, send an error message back to the client
        return res.status(400).json({ message: "Username is already taken" })
    }
    try {
        // Try to create a new user with the provided username, hashed password, and image
        const user = await User.create({
            username,
            password: hashedPassword,
            image
        })
        // Send a success message to the client
        return res.status(201).json({ message: "User created successfully" })
    }
    catch (err) {
        // If there is an error in creating the user, send an error message back to the client
        return res.status(500).json({ error: err })
    }
}

export const logIn = async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials!" })
    }
    const isPasswrodValid = await bcrypt.compare(password, user.password)
    if (!isPasswrodValid){
        return res.status(401).json({ message: "Invalid credentials"})
    }
    // else log the user in and give him a jwt cookie

    const expirationTime = 1000*60*60*24*7
    const accessToken = jwt.sign(
        {
            id:user.id
        }, 

        process.env.ACCESS_TOKEN_SECRET,

        { 
            expiresIn: expirationTime
        }
    )

    res.cookie('token', accessToken, {
        httpOnly: true,
        // secure: true,
        maxAge: expirationTime,
    })
    .status(200)
    .json({
        id: user.id,
        username: user.username,
    });
    // send use data so it coud be saved in broswer storage but not the password 
}

export const logOut = (req, res) => {
    // this is how cookies are ceared out
    res.clearCookie("token").status(200).json({message:"LogOut Successful"})
}
