/* eslint-disable camelcase */
import { PrismaClient, Prisma } from '@prisma/client' // Importa Prisma y PrismaClient
const prisma = new PrismaClient()

// *Service to get all Purchases of especific user
export const getUserPurchasesService = async (idUser) => {
  if (!idUser) {
    throw new Error('Debe proporcionar un ID de usuario.')
  }
  try {
    const purchases = await prisma.sales.findMany({
      where: { id_user: idUser },
      select: {
        id_sales: true,
        total_price: true,
        finalize_at: true,
        canceled_at: true,
        canceled_reason: true,
        cotized_at: true,
        delivered_at: true,
        purchased_at: true,
        send_at: true,
        create_at: true,
        SalesStatus: {
          select: {
            id_status: true,
            name: true,
            description: true
          }
        },
        SalesTemplate: {
          select: {
            id_sales: true,
            id_template: true,
            box_amount: true,
            box_price: true,
            bottle_amount: true,
            bottle_price: true,
            decorator_type: true,
            decorator_price: true,
            template: {
              select: {
                id_template: true,
                design: true
              }
            }
          }
        }
      }
    })

    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id_sales,
      totalPrice: purchase.total_price,
      status: purchase.SalesStatus.id_status,
      strStatus: purchase.SalesStatus.name,
      finalizeAt: purchase.finalize_at,
      canceledAt: purchase.canceled_at,
      canceledReason: purchase.canceled_reason,
      cotizedAt: purchase.cotized_at,
      deliveredAt: purchase.delivered_at,
      purchasedAt: purchase.purchased_at,
      sendAt: purchase.send_at,
      createAt: purchase.create_at,
      // Mapeo de las plantillas
      salesTemplates: purchase.SalesTemplate.map(template => ({
        idSales: template.id_sales,
        idTemplate: template.id_template,
        boxAmount: template.box_amount,
        boxPrice: template.box_price,
        bottleAmount: template.bottle_amount,
        bottlePrice: template.bottle_price,
        decoratorType: template.decorator_type,
        decoratorPrice: template.decorator_price,
        desing: template.template.design
      }))
    }))

    return formattedPurchases
  } catch (error) {
    console.error('Error al obtener las compras con productos:', error)
    throw error
  }
}

// *Service to create Templates
export const createTemplatesService = async (req) => {
  const { id_users, design, decorator } = req

  // Validación de campos obligatorios
  if (!id_users) {
    throw new Error("El campo 'id_users' es obligatorio.")
  }
  if (!design) {
    throw new Error("El campo 'design' es obligatorio.")
  }

  try {
    // Validar que el usuario exista
    const existingUser = await prisma.users.findUnique({
      where: { id_users }
    })
    if (!existingUser) {
      throw new Error('El usuario especificado no existe.')
    }

    // Crear la nueva plantilla
    const newTemplate = await prisma.templates.create({
      data: {
        id_users,
        design,
        decorator
      }
    })
    return newTemplate
  } catch (error) {
    console.error('Error al crear el diseño:', error)
    throw error
  }
}

/**
 * *Valida si un ID de usuario existe en la base de datos
 * @param {string} id_user - El ID del usuario a validar.
 * @returns {boolean} - Devuelve `true` si el usuario existe, de lo contrario `false`.
 */
const validateUserExists = async (id_user) => {
  const user = await prisma.users.findUnique({
    where: { id_users: id_user }
  })
  return user !== null
}

/**
 * Valida si el estado de la venta existe en la base de datos
 * @param {number} status - El ID del estado de la venta a validar.
 * @returns {boolean} - Devuelve `true` si el estado existe, de lo contrario `false`.
 */
const validateSalesStatusExists = async (status) => {
  const salesStatus = await prisma.salesStatus.findUnique({
    where: { id_status: status }
  })
  return salesStatus !== null
}

/**
 * Valida si el template existe en la base de datos
 * @param {string} id_template - El ID del template a validar.
 * @returns {boolean} - Devuelve `true` si el template existe, de lo contrario `false`.
 */
const validateTemplateExists = async (id_template) => {
  const template = await prisma.templates.findUnique({
    where: { id_template }
  })
  return template !== null
}

/**
 * Valida si el template pertenece al usuario
 * @param {string} id_user - El ID del usuario que está realizando la venta.
 * @param {string} id_template - El ID del template a verificar.
 * @returns {boolean} - Devuelve `true` si el template pertenece al usuario, de lo contrario `false`.
 */
const validateTemplateBelongsToUser = async (id_user, id_template) => {
  const template = await prisma.templates.findFirst({
    where: {
      id_template,
      id_users: id_user // Verifica si el template pertenece al usuario
    }
  })
  return template !== null
}

/**
 * ?Crea una venta (Sales) junto con los detalles de los templates (SalesTemplate).
 * @param {Object} salesData - Datos de la venta a crear.
 * @returns {Object} - Objeto con la venta creada.
 */
export const createPurchaseService = async (salesData) => {
  const {
    id_user,
    total_price,
    status,
    cotized_at,
    purchased_at,
    send_at,
    delivered_at,
    canceled_at,
    canceled_reason,
    salesTemplates
  } = salesData

  // Lista de campos obligatorios para validar
  const requiredFields = [
    { field: 'id_user', value: id_user },
    { field: 'status', value: status },
    { field: 'salesTemplates', value: salesTemplates }
  ]

  // Verificar si algún campo requerido está ausente o inválido
  for (const { field, value } of requiredFields) {
    if (!value || (field === 'salesTemplates' && (!Array.isArray(value) || value.length === 0))) {
      const error = new Error(`Faltan campos obligatorios: ${field} es necesario.`)
      error.name = 'MissingFieldsError'
      throw error
    }
  }

  // Validar que si el estado es 1, total_price debe ser null o vacío
  if (status === 1 && total_price != null && total_price !== '') {
    const error = new Error('Si el estado de la compra es cotización, el campo precio total debe estar vacío.')
    error.name = 'InvalidTotalPriceError'
    throw error
  }

  if (status > 2) {
    const error = new Error('el estado de la compra no puede ser enviado, entregado o cancelado')
    error.name = 'ForbiddenError'
    throw error
  }

  // Validar que si el estado es 1, total_price debe ser null o vacío
  if (status >= 2 && status <= 6 && (total_price === null || total_price === '')) {
    const error = new Error('Si el estado de la compra no es cotización, el precio total debe de estar incluido.')
    error.name = 'InvalidTotalPriceError'
    throw error
  }

  // Validar que el usuario exista
  const userExists = await validateUserExists(id_user)
  if (!userExists) {
    const error = new Error(`El usuario con id ${id_user} no existe.`)
    error.name = 'NotFoundError'
    throw error
  }

  // Validar que el estado de la venta exista
  const statusExists = await validateSalesStatusExists(status)
  if (!statusExists) {
    const error = new Error(`El estado con id ${status} no existe.`)
    error.name = 'NotFoundError'
    throw error
  }

  // Validar que todos los templates existan y que pertenezcan al usuario
  for (const template of salesTemplates) {
    const templateExists = await validateTemplateExists(template.id_template)
    if (!templateExists) {
      const error = new Error(`El template con id ${template.id_template} no existe.`)
      error.name = 'NotFoundError'
      throw error
    }

    const templateBelongsToUser = await validateTemplateBelongsToUser(id_user, template.id_template)
    if (!templateBelongsToUser) {
      const error = new Error(`El template con id ${template.id_template} no pertenece al usuario con id ${id_user}.`)
      error.name = 'ForbiddenError'
      throw error
    }
  }

  try {
    // Crear la venta en la base de datos
    const sale = await prisma.sales.create({
      data: {
        id_user,
        total_price,
        status,
        purchased_at,
        SalesTemplate: {
          create: salesTemplates.map(template => ({
            id_template: template.id_template,
            box_amount: template.box_amount,
            box_price: template.box_price,
            bottle_amount: template.bottle_amount,
            bottle_price: template.bottle_price,
            decorator_type: template.decorator_type,
            decorator_price: template.decorator_price
          }))
        }
      }
    })

    return sale
  } catch (error) {
    console.error('Error creando la venta:', error)
    const customError = new Error('Error al crear la venta')
    customError.name = 'InternalError'
    throw customError
  }
}

/**
 * ?Crea una venta (Sales) junto con los detalles de los templates (SalesTemplate).
 * @param {Object} salesData - Datos de la venta a crear.
 * @returns {Object} - Objeto con la venta creada.
 */
export const updatePurchaseToPayService = async (data) => {
  const { id_sales, total_price, decorator_price } = data

  try {
    const updatedSale = await prisma.sales.update({
      where: { id_sales },
      data: {
        total_price: (total_price + decorator_price),
        status: 2,
        cotized_at: new Date(),
        SalesTemplate: {
          updateMany: {
            where: { id_sales },
            data: {
              decorator_price
            }
          }
        }
      }
    })

    return updatedSale
  } catch (error) {
    console.error('Error al cotizar la etiqueta de la compra', error)
    const customError = new Error('Error al cotizar la venta')
    customError.name = 'InternalError'
    throw customError
  }
}

// Función para formatear como moneda (puedes reutilizarla siempre que lo necesites)
const formatCurrency = (value) => {
  if (typeof value === 'number' && !isNaN(value)) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value)
  }
  return value
}

const getPriceWithIva = (price) => {
  const ivaAmount = price * 0.19
  const totalPlusIva = price + ivaAmount
  return formatCurrency(totalPlusIva)
}

// ?controller to get all Purchases, firts: data getted since 5months ago, if props are not null the periode will be change
export const getAllPurchasesService = async (year) => {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date((year || currentYear), 0, 1) // ?1 de enero
  const endOfYear = new Date((year || currentYear), 11, 31, 23, 59, 59) // ?31 de diciembre

  try {
    const purchases = await prisma.sales.findMany({
      where: {
        create_at: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: {
        create_at: 'desc'
      },
      select: {
        id_sales: true,
        total_price: true,
        finalize_at: true,
        canceled_at: true,
        canceled_reason: true,
        cotized_at: true,
        delivered_at: true,
        purchased_at: true,
        send_at: true,
        create_at: true,
        SalesStatus: {
          select: {
            id_status: true,
            name: true
            // description: true
          }
        },
        SalesTemplate: {
          select: {
            id_sales: true,
            id_template: true,
            box_amount: true,
            box_price: true,
            bottle_amount: true,
            bottle_price: true,
            decorator_type: true,
            decorator_price: true,
            template: {
              select: {
                id_template: true,
                design: true
              }
            }
          }
        },
        usuario: { // Relación con Users
          select: {
            id_users: true,
            avatar: true,
            document_type: true,
            document: true,
            name: true,
            id_country: true,
            id_department: true,
            id_city: true,
            address: true,
            phone: true,
            email: true,
            id_rol: true,
            status: true,
            create_at: true,
            update_at: true,
            country: {
              select: {
                id_country: true,
                name: true // Puedes agregar más campos de Country si los necesitas
              }
            },
            department: {
              select: {
                id_department: true,
                name: true // Puedes agregar más campos de Department si los necesitas
              }
            },
            city: {
              select: {
                id_city: true,
                name: true // Puedes agregar más campos de City si los necesitas
              }
            },
            role: {
              select: {
                id_rol: true,
                name: true // Puedes agregar más campos de Role si los necesitas
              }
            },
            documentType: {
              select: {
                id_document_type: true,
                name: true // Puedes agregar más campos de DocumentType si los necesitas
              }
            }
          }
        }
      }
    })
    const formatDate = (date) => date ? date.toISOString().split('T')[0] : null

    const formattedPurchases = purchases.map(purchase => ({
      avatar: purchase.usuario.avatar,
      name: purchase.usuario.name,
      phone: purchase.usuario.phone,
      email: purchase.usuario.email,
      document: purchase.usuario.document,
      idTipe: purchase.usuario.documentType.name,
      country: purchase.usuario.country.name,
      address: (purchase.usuario.department.name + '-' + purchase.usuario.city.name + '-' + purchase.usuario.address),
      id: purchase.id_sales,
      total_price: formatCurrency(purchase.total_price, 'Falta cotizar etiqueta'),
      ivaPrice: formatCurrency(purchase.total_price * 0.19),
      totalPlusIva: getPriceWithIva(purchase.total_price),
      status: purchase.SalesStatus.id_status,
      strStatus: purchase.SalesStatus.name,
      finalizeAt: formatDate(purchase.finalize_at),
      canceledAt: formatDate(purchase.canceled_at),
      canceledReason: purchase.canceled_reason,
      cotizedAt: formatDate(purchase.cotized_at),
      deliveredAt: formatDate(purchase.delivered_at) || 'No se ha entregado el pedido',
      purchasedAt: formatDate(purchase.purchased_at) || 'No se ha realizado el pago',
      shippingAt: formatDate(purchase.send_at) || 'No se ha realizado el envio',
      createAt: formatDate(purchase.create_at),
      // Mapeo de las plantillas
      salesTemplates: purchase.SalesTemplate.map(template => ({
        idSales: template.id_sales,
        idTemplate: template.id_template,
        boxAmount: template.box_amount,
        boxPrice: formatCurrency(template.box_price),
        bottleAmount: template.bottle_amount,
        bottlePrice: formatCurrency(template.bottle_price),
        decoratorType: template.decorator_type,
        decoratorPrice: formatCurrency(template.decorator_price),
        desing: template.template.design,
        totalBoxPrices: formatCurrency(template.box_price * template.box_amount)
      }))
    }))

    return formattedPurchases
  } catch (error) {
    console.error('Error al obtener las compras con productos:', error)
    throw error
  }
}

export const getYearsPurchasesService = async () => {
  try {
    const yearsWithSales = await prisma.sales.findMany({
      select: {
        create_at: true
      },
      orderBy: {
        create_at: 'desc'
      }
    })

    // Extrae los años de las fechas y elimina duplicados
    const years = Array.from(new Set(yearsWithSales.map(sale => sale.create_at.getFullYear())))

    return years
  } catch (error) {
    console.error('Error al obtener las compras con productos:', error)
    throw error
  }
}

// ?Cotize template service
export const cotizeTemplateService = async () => {
  try {
    
  } catch (error) {
    
  }
}
