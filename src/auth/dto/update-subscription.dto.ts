import { IsIn, IsNotEmpty, IsString, NotEquals } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['mini', 'pro', 'premium', 'free'], {
    message: 'Subscription must be mini, pro, premium, or free',
  })
  @NotEquals('royal', {
    message: 'The royal subscription tier is not allowed.',
  })
  subscription: string;
}
