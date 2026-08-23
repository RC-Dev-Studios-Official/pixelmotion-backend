import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthForgotPasswordController } from './auth/auth-forgot-password.controller';
import { AuthForgotPasswordService } from './auth/auth-forgot-password.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule, ProjectsModule],
  controllers: [AppController, AuthForgotPasswordController],
  providers: [AppService, AuthForgotPasswordService],
})
export class AppModule {}
