const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log("the token is ", token);
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userData = decoded;
    console.log("decoded token is ", req.userData);
    //
    var d = jwt.decode(token, { complete: true });
    console.log(" decoded header", d.header);
    console.log("decoded header", d.payload);
    //
    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Auth mdfailed",
    });
  }
};
