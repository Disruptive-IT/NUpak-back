import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const getUserAccountService = async (userId) => {
  try {
    const userAccountInfo = await prisma.usuarios.findFirst({ where: { id_rol: userId } })
    if (!userAccountInfo) { throw new Error('Usuario no encontrado.') }
    return userAccountInfo
  } catch (error) {
    console.error('Error al buscar al usuario: ', error)
    throw error
  }
}

export const createNewUserService = async (data) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10) // ?hash de contrasena generica
    const user = await prisma.usuarios.create({
      data: {
        documentType: { connect: { id_document_type: data.documentType } },
        document: data.document,
        name: data.name,
        department: { connect: { id_department: data.department } },
        city: { connect: { id_city: data.city } },
        address: data.address,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        role: { connect: { id_rol: 1 } }
      }
    })
    return user
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // !Este es el error cuando el registro no existe
      throw new Error('Duplicate Email')
    } else {
      console.error('Error al actualizar el usuario:', error)
      throw error
    }
  }
}

// *Servicio que me trae todos los usuarios con el rol Admin
export const getAllUsersService = async () => {
  try {
    const users = await prisma.usuarios.findMany({
      where: { id_rol: 1 },
      select: {
        id_users: true,
        avatar: true,
        documentType: { select: { name: true, id_document_type:true } },
        document: true,
        name: true,
        department: { select: { name: true } },
        city: { select: { name: true } },
        address: true,
        phone: true,
        email: true,
        id_rol: true,
        status: true
      }
    })
    const formattedUsers = users.map(user => ({
      id: user.id_users,
      avatar: user.avatar,
      idTipe: user.documentType.name,
      strIDTipe: user.documentType.id_document_type,
      document: user.document,
      name: user.name,
      department: user.department.name,
      city: user.city.name,
      address: user.address,
      phone: user.phone,
      email: user.email,
      id_rol: user.id_rol,
      status: user.status,
      strStatus: !user.status ? 'Inactivo' : 'Activo'
    }))
    if (!users) {
      throw new Error('0 users found in the database.')
    }
    return formattedUsers
  } catch (error) {
    console.error('Error searching users information: ', error)
    throw error
  }
}

// *Servicio que me trae todos los usuarios con el rol Client
export const getAllClientsService = async () => {
  try {
    const users = await prisma.usuarios.findMany({
      where: { id_rol: 2 },
      select: {
        id_users: true,
        avatar: true,
        documentType: { select: { name: true, id_document_type:true } },
        document: true,
        name: true,
        department: { select: { name: true } },
        city: { select: { name: true } },
        address: true,
        phone: true,
        email: true,
        id_rol: true,
        status: true
      }
    })
    const formattedUsers = users.map(user => ({
      id: user.id_users,
      avatar: user.avatar,
      idTipe: user.documentType.name,
      strIDTipe: user.documentType.id_document_type,
      document: user.document,
      name: user.name,
      department: user.department.name,
      city: user.city.name,
      address: user.address,
      phone: user.phone,
      email: user.email,
      id_rol: user.id_rol,
      status: user.status,
      strStatus: !user.status ? 'Inactivo' : 'Activo'
    }))
    if (!users) {
      throw new Error('0 users found in the database.')
    }
    return formattedUsers
  } catch (error) {
    console.error('Error searching users information: ', error)
    throw error
  }
}

// *servicio que me permite elimianr usuarios del sistema
export const DeleteUser = async (userId) => {
  try {
    const userDelete = await prisma.Usuarios.delete({ where: { id_users: userId } })
    if (!userDelete) { throw new Error('Usuario no encontrado.') }
    return userDelete
  } catch (error) {
    console.error('Error al eliminar el usuario: ', error)
    throw error
  }
}
