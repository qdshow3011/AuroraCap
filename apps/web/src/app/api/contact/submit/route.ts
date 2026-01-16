import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, phone, role } = body;

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      // For demonstration purposes, we'll use a simple SMTP setup
      // In a production environment, you should use a secure email service
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-email-password', // Replace with your email password or app password
      },
    });

    // Email content
    const mailOptions = {
      from: email,
      to: 'qdshow@gmail.com', // Administrator email
      subject: 'Invitation Code Application',
      html: `
        <h2>Invitation Code Application</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Role:</strong> ${role}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    return NextResponse.json({
      message: 'Application submitted successfully',
    });

  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application', details: error.message },
      { status: 500 }
    );
  }
}
