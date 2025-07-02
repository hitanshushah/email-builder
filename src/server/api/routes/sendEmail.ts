import { FastifyPluginAsync } from 'fastify';
import nodemailer from 'nodemailer';

const sendEmailRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/send-email', async (request, reply) => {
    if (!request.user?.username || !request.user?.user_id) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }
    const { to, html, subject = 'Test Email from Email Builder' } = request.body as {
      to: string;
      subject?: string;
      html: string;
    };
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.purelymail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.PURELYMAIL_EMAIL,
        pass: process.env.PURELYMAIL_PASS,
      },
    });
    try {
      const info = await transporter.sendMail({
        from: process.env.PURELYMAIL_EMAIL,
        to,
        subject,
        html,
      });
      return reply.status(200).send({ success: true, info });
    } catch (error) {
      console.error('Send email error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to send email' });
    }
  });
};

export default sendEmailRoute; 