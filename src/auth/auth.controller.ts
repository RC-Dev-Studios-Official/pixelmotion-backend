import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { DeviceTokenDto } from './dto/device-token.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ValidationPipe()) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body(new ValidationPipe()) dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }


  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ValidationPipe()) dto: RegisterDto) {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.fullName ?? dto.name,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }

  @UseGuards(AuthGuard)
  @Get('subscription')
  @HttpCode(HttpStatus.OK)
  async getSubscription(@Request() req: any) {
    return this.authService.getSubscription(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('subscription')
  @HttpCode(HttpStatus.OK)
  async updateSubscription(
    @Request() req: any,
    @Body(new ValidationPipe()) dto: UpdateSubscriptionDto,
  ) {
    return this.authService.updateSubscription(req.user.sub, dto.subscription);
  }

  @UseGuards(AuthGuard)
  @Get('token-balance')
  @HttpCode(HttpStatus.OK)
  async getTokenBalance(@Request() req: any) {
    return this.authService.getTokenBalance(req.user.sub);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Body(new ValidationPipe()) dto: DeviceTokenDto) {
    return this.authService.registerDeviceToken(dto);
  }
}
