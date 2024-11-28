import jwt from "jsonwebtoken"

export const authMiddleWare = (req, res, next) => {
    const token = req.cookies.token
    if (!token){
        return res.status(401).json({message: 'Not Authenticated'})
    }
    // if ther is token check if it's vaIid
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({message: "Token is Not Valid"})
        } 
        else {
            // set the user id that is encoded in the jwt so the portected route has access to the id and can use it to do valid crud oprations on the data associated with it
            req.userId = data.id
            next()
        }
    })
}