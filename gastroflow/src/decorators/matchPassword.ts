import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class MatchPassword implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;

    const key = args.constraints[0]; //*'password'
    const password = obj[key];

    if (confirmPassword !== password) {
      return false;
    }

    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'El password y ConfirmPassword no coinciden';
  }
}