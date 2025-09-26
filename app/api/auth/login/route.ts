// app/api/auth/login/route.ts
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SessionData } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface LoginRequest {
  email: string;
  spe_number: string;
  recaptchaToken: string;
}

interface LoginResponse {
  success: boolean;
  redirect?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { email, spe_number, recaptchaToken }: LoginRequest = await request.json();

    if (!email || !spe_number || !recaptchaToken) {
      return NextResponse.json<ErrorResponse>({
        error: 'Bad Request',
        message: 'Email, SPE number and reCAPTCHA token are required'
      }, { status: 400 });
    }

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });

    const recaptchaData = await recaptchaResponse.json();
    if (!recaptchaData.success) {
      return NextResponse.json<ErrorResponse>({
        error: 'Invalid reCAPTCHA',
        message: 'Please complete the reCAPTCHA verification'
      }, { status: 400 });
    }

    // Check user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, spe_number, level, has_voted')
      .eq('email', email.toLowerCase())
      .eq('spe_number', spe_number)
      .single();

    if (error || !user) {
      return NextResponse.json<ErrorResponse>({
        error: 'Invalid Credentials',
        message: 'Invalid email or SPE number'
      }, { status: 401 });
    }

    // Check if user has already voted
    if (user.has_voted) {
      return NextResponse.json<ErrorResponse>({
        error: 'Already Voted',
        message: 'You have already completed voting'
      }, { status: 403 });
    }

    // Create session data
    const sessionData: SessionData = {
      id: user.id,
      email: user.email,
      spe_number: user.spe_number,
      level: user.level
    };

    // Create JWT token
    const token = createToken(sessionData);

    // Set cookie
    (await
          // Set cookie
          cookies()).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return NextResponse.json<LoginResponse>({
      success: true,
      redirect: '/vote'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json<ErrorResponse>({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred during login'
    }, { status: 500 });
  }
}