import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendRecoverEmail (email, token, id) {
  return await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Recuperacion de contraseña - NuPack',
    html: RecoverPassEmail(token, id)
  })
}

function RecoverPassEmail (token, id) {
  return `
      <!DOCTYPE html>
      <html lang="es">
      <style>
          html{
              background-color: white;
          }
          body{
              max-width: 600px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: auto;
              background-color: rgb(229, 255, 246);
              padding: 40px;
              border-radius: 4px;
              margin-top: 10px;
          }
      </style>
      <body>
          <h1>!Sigue los pasos para recuperar tu contraseña!</h1>
          <p>Hemos enviado este correo para poder ayudarte a restablecer tu contraseña para tu cuenta en NuPack.</p>
          <p>Por favor, sigue las instrucciones en el correo electrónico para restablecer tu contraseña.</p>
          <p>Cambia la contraseña de tu cuenta: <a href="http://localhost:5173/recoverPassword?token=${token}" target="_blank" rel="noopener noreferrer">haciendo click aquí</a>.
      </body>
      </html>
      `
}
