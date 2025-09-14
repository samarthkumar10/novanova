export const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new CustomError("Access denied. No token provided.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.tenant = { id: decoded.tenantId };
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// export default AuthController;