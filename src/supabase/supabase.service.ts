import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  public readonly client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'Supabase environment variables are missing. Add SUPABASE_URL and SUPABASE_ANON_KEY.',
      );
    }

    this.client = createClient(
      supabaseUrl ?? 'https://placeholder.supabase.co',
      supabaseKey ?? 'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  async sendOtp(email: string) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: process.env.SUPABASE_REDIRECT_URL,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async verifyOtp(email: string, token: string) {
    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async resetPassword(email: string) {
    const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.SUPABASE_REDIRECT_URL,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
