import nodemailer from 'nodemailer';

const smtpHost = process.env.EMAIL_HOST;
const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS;
const smtpFrom = process.env.EMAIL_FROM || smtpUser;
const smtpSecure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

const canSendMail = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = canSendMail
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export async function sendWelcomePasswordEmail(params: {
  to: string;
  username: string;
  password: string;
}) {
  if (!transporter) {
    console.warn('Configuration email incomplète, email non envoyé');
    return false;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: 'Votre compte DAO 2SND est créé',
    text: `Bonjour ${params.username},\n\nVotre compte a été créé.\nNom d'utilisateur: ${params.username}\nMot de passe temporaire: ${params.password}\n\nVeuillez vous connecter puis changer ce mot de passe dès que possible.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #0f172a;">Votre compte DAO 2SND est créé</h2>
        <p>Bonjour <strong>${params.username}</strong>,</p>
        <p>Votre compte a été créé avec succès.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px 0;"><strong>Nom d'utilisateur :</strong> ${params.username}</p>
          <p style="margin:0;"><strong>Mot de passe temporaire :</strong> ${params.password}</p>
        </div>
        <p>Veuillez vous connecter et changer ce mot de passe dès que possible.</p>
      </div>
    `,
  });

  return true;
}