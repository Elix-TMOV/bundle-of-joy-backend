import jwt from "jsonwebtoken"
export const should_be_logged_in = async (req, res) => {
    // check if the request has a cookie if yes return resopose authorized else authorized
    return res.status(200).json({message: req.userId})
}
