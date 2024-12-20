import jwt from 'jsonwebtoken'

const generateJWT = (user) => {
  return jwt.sign({
    id: user.id,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '1d'
  })
}

export default generateJWT
