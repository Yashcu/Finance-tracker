import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Function to generate a 4-digit OTP
function generateOTP() {
  // Generate a random number between 1000 and 9999
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// In a real-world scenario, you would use an email service like SendGrid, Mailgun, etc.
async function sendOTPEmail(email: string, otp: string) {
  // This is a placeholder for the email sending logic
  console.log(`Password reset OTP for ${email}: ${otp}`);
  
  // For development purposes only - make it very visible in the console
  console.log("\n\n========== DEVELOPMENT ONLY ==========");
  console.log("📧 RESET PASSWORD OTP EMAIL");
  console.log(`📧 To: ${email}`);
  console.log(`📧 OTP: ${otp}`);
  console.log("📧 The OTP is valid for 1 hour");
  console.log("=======================================\n\n");
  
  // Return true to simulate successful email sending
  return true;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return a 200 status even if the user doesn't exist
    // This prevents user enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        { message: "If an account with that email exists, a password reset OTP has been sent." },
        { status: 200 }
      );
    }

    // Generate 4-digit OTP and expiry
    const resetOTP = generateOTP();
    const resetOTPExpires = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      // Update user with reset OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOTP,
          resetOTPExpires
        }
      });
    } catch (error) {
      console.error("Error updating user with reset OTP:", error);
      throw error;
    }
    
    // Send email with OTP
    await sendOTPEmail(email, resetOTP);

    return NextResponse.json(
      { message: "If an account with that email exists, a password reset OTP has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 