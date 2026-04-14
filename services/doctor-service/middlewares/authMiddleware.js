import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
    });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  const userRole = String(req.user?.role || "").toUpperCase();
  const allowedRoles = roles.map((role) => String(role).toUpperCase());

  if (!req.user || !allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: insufficient permissions",
    });
  }

  next();
};

export { protect, authorizeRoles };